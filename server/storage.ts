import {
  users,
  characters,
  factions,
  corporations,
  locations,
  locationThreads,
  threadPosts,
  aiEvents,
  messages,
  characterFactionReputation,
  stockHoldings,
  characterEventResponses,
  type User,
  type UpsertUser,
  type Character,
  type InsertCharacter,
  type Faction,
  type Corporation,
  type Location,
  type LocationThread,
  type ThreadPost,
  type InsertThreadPost,
  type AIEvent,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Character operations
  getCharacterByUserId(userId: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, updates: Partial<Character>): Promise<Character>;
  
  // Faction operations
  getAllFactions(): Promise<Faction[]>;
  getCharacterFactionReputations(characterId: number): Promise<Array<{faction: Faction, reputation: number}>>;
  updateFactionReputation(characterId: number, factionId: number, change: number): Promise<void>;
  
  // Corporation operations
  getAllCorporations(): Promise<Corporation[]>;
  updateCorporationPrice(id: number, newPrice: number, change24h: number): Promise<void>;
  getStockHoldings(characterId: number): Promise<Array<{corporation: Corporation, shares: number, avgBuyPrice: number}>>;
  
  // Location operations
  getAllLocations(): Promise<Location[]>;
  getLocationThreads(locationId: number): Promise<Array<LocationThread & {creator: Character, postCount: number}>>;
  createLocationThread(thread: Omit<LocationThread, "id" | "createdAt" | "updatedAt">): Promise<LocationThread>;
  getThreadPosts(threadId: number): Promise<Array<ThreadPost & {character: Character}>>;
  createThreadPost(post: InsertThreadPost): Promise<ThreadPost>;
  
  // AI Events operations
  getActiveEvents(characterId?: number): Promise<AIEvent[]>;
  createAIEvent(event: Omit<AIEvent, "id" | "createdAt">): Promise<AIEvent>;
  respondToEvent(characterId: number, eventId: number, choiceIndex: number, response?: string): Promise<void>;
  
  // Messages operations
  getCharacterMessages(characterId: number): Promise<Array<Message & {fromCharacterName?: string}>>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCharacterByUserId(userId: string): Promise<Character | undefined> {
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.userId, userId));
    return character;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const [newCharacter] = await db
      .insert(characters)
      .values(character)
      .returning();
    return newCharacter;
  }

  async updateCharacter(id: number, updates: Partial<Character>): Promise<Character> {
    const [updated] = await db
      .update(characters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(characters.id, id))
      .returning();
    return updated;
  }

  async getAllFactions(): Promise<Faction[]> {
    return await db.select().from(factions);
  }

  async getCharacterFactionReputations(characterId: number): Promise<Array<{faction: Faction, reputation: number}>> {
    const result = await db
      .select({
        faction: factions,
        reputation: characterFactionReputation.reputation,
      })
      .from(characterFactionReputation)
      .innerJoin(factions, eq(factions.id, characterFactionReputation.factionId))
      .where(eq(characterFactionReputation.characterId, characterId));
    
    return result.map(r => ({
      faction: r.faction,
      reputation: r.reputation || 0
    }));
  }

  async updateFactionReputation(characterId: number, factionId: number, change: number): Promise<void> {
    await db
      .insert(characterFactionReputation)
      .values({
        characterId,
        factionId,
        reputation: change,
      })
      .onConflictDoUpdate({
        target: [characterFactionReputation.characterId, characterFactionReputation.factionId],
        set: {
          reputation: sql`${characterFactionReputation.reputation} + ${change}`,
        },
      });
  }

  async getAllCorporations(): Promise<Corporation[]> {
    return await db.select().from(corporations).orderBy(corporations.symbol);
  }

  async updateCorporationPrice(id: number, newPrice: number, change24h: number): Promise<void> {
    await db
      .update(corporations)
      .set({
        price: newPrice.toString(),
        change24h: change24h.toString(),
        updatedAt: new Date(),
      })
      .where(eq(corporations.id, id));
  }

  async getStockHoldings(characterId: number): Promise<Array<{corporation: Corporation, shares: number, avgBuyPrice: number}>> {
    const result = await db
      .select({
        corporation: corporations,
        shares: stockHoldings.shares,
        avgBuyPrice: stockHoldings.avgBuyPrice,
      })
      .from(stockHoldings)
      .innerJoin(corporations, eq(corporations.id, stockHoldings.corporationId))
      .where(eq(stockHoldings.characterId, characterId));
    
    return result.map(row => ({
      ...row,
      avgBuyPrice: parseFloat(row.avgBuyPrice || "0"),
    }));
  }

  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getLocationThreads(locationId: number): Promise<Array<LocationThread & {creator: Character, postCount: number}>> {
    const result = await db
      .select({
        thread: locationThreads,
        creator: characters,
        postCount: sql<number>`count(${threadPosts.id})`.as("postCount"),
      })
      .from(locationThreads)
      .innerJoin(characters, eq(characters.id, locationThreads.createdBy))
      .leftJoin(threadPosts, eq(threadPosts.threadId, locationThreads.id))
      .where(eq(locationThreads.locationId, locationId))
      .groupBy(locationThreads.id, characters.id)
      .orderBy(desc(locationThreads.updatedAt));
    
    return result.map(row => ({
      ...row.thread,
      creator: row.creator,
      postCount: row.postCount,
    }));
  }

  async createLocationThread(thread: Omit<LocationThread, "id" | "createdAt" | "updatedAt">): Promise<LocationThread> {
    const [newThread] = await db
      .insert(locationThreads)
      .values(thread)
      .returning();
    return newThread;
  }

  async getThreadPosts(threadId: number): Promise<Array<ThreadPost & {character: Character}>> {
    const result = await db
      .select({
        post: threadPosts,
        character: characters,
      })
      .from(threadPosts)
      .innerJoin(characters, eq(characters.id, threadPosts.characterId))
      .where(eq(threadPosts.threadId, threadId))
      .orderBy(threadPosts.createdAt);
    
    return result.map(row => ({
      ...row.post,
      character: row.character,
    }));
  }

  async createThreadPost(post: InsertThreadPost): Promise<ThreadPost> {
    const [newPost] = await db
      .insert(threadPosts)
      .values(post)
      .returning();
    
    // Update thread's updatedAt timestamp
    await db
      .update(locationThreads)
      .set({ updatedAt: new Date() })
      .where(eq(locationThreads.id, post.threadId));
    
    return newPost;
  }

  async getActiveEvents(characterId?: number): Promise<AIEvent[]> {
    let query = db
      .select()
      .from(aiEvents)
      .where(
        and(
          eq(aiEvents.isActive, true),
          sql`${aiEvents.expiresAt} IS NULL OR ${aiEvents.expiresAt} > NOW()`
        )
      );
    
    if (characterId) {
      query = db
        .select()
        .from(aiEvents)
        .where(
          and(
            eq(aiEvents.isActive, true),
            sql`${aiEvents.expiresAt} IS NULL OR ${aiEvents.expiresAt} > NOW()`,
            sql`${aiEvents.targetCharacter} IS NULL OR ${aiEvents.targetCharacter} = ${characterId}`
          )
        );
    }
    
    return await query.orderBy(desc(aiEvents.createdAt));
  }

  async createAIEvent(event: Omit<AIEvent, "id" | "createdAt">): Promise<AIEvent> {
    const [newEvent] = await db
      .insert(aiEvents)
      .values(event)
      .returning();
    return newEvent;
  }

  async respondToEvent(characterId: number, eventId: number, choiceIndex: number, response?: string): Promise<void> {
    await db
      .insert(characterEventResponses)
      .values({
        characterId,
        eventId,
        choiceIndex,
        response,
      });
  }

  async getCharacterMessages(characterId: number): Promise<Array<Message & {fromCharacterName?: string}>> {
    const result = await db
      .select({
        message: messages,
        fromCharacterName: characters.name,
      })
      .from(messages)
      .leftJoin(characters, eq(characters.id, messages.fromCharacter))
      .where(eq(messages.toCharacter, characterId))
      .orderBy(desc(messages.createdAt));
    
    return result.map(row => ({
      ...row.message,
      fromCharacterName: row.fromCharacterName || row.message.senderName || undefined,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }
}

export const storage = new DatabaseStorage();
