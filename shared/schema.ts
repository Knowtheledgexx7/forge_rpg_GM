import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Characters table
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  species: varchar("species").notNull(),
  homeworld: varchar("homeworld").notNull(),
  allegiance: varchar("allegiance").default("Neutral"),
  forceSensitive: boolean("force_sensitive").default(false),
  forceAlignment: real("force_alignment").default(0), // -1 to 1 (dark to light)
  credits: integer("credits").default(10000),
  currentLocation: varchar("current_location").notNull(),
  avatar: varchar("avatar"),
  biography: text("biography"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Factions table
export const factions = pgTable("factions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  color: varchar("color"),
  icon: varchar("icon"),
});

// Character faction reputation table
export const characterFactionReputation = pgTable("character_faction_reputation", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => characters.id),
  factionId: integer("faction_id").notNull().references(() => factions.id),
  reputation: integer("reputation").default(0), // -100 to 100
});

// Corporations table
export const corporations = pgTable("corporations", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  sector: varchar("sector"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  change24h: decimal("change_24h", { precision: 5, scale: 2 }).default("0"),
  volume: integer("volume").default(0),
  marketCap: decimal("market_cap", { precision: 15, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stock holdings table
export const stockHoldings = pgTable("stock_holdings", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => characters.id),
  corporationId: integer("corporation_id").notNull().references(() => corporations.id),
  shares: integer("shares").notNull(),
  avgBuyPrice: decimal("avg_buy_price", { precision: 10, scale: 2 }),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  planet: varchar("planet").notNull(),
  system: varchar("system").notNull(),
  description: text("description"),
  locationType: varchar("location_type"), // cantina, spaceport, marketplace, etc.
  backgroundImage: varchar("background_image"),
  coordinates: jsonb("coordinates"), // {x, y} for galaxy map
});

// Location threads (forum-style roleplay)
export const locationThreads = pgTable("location_threads", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull().references(() => locations.id),
  title: varchar("title").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => characters.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Thread posts
export const threadPosts = pgTable("thread_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => locationThreads.id),
  characterId: integer("character_id").notNull().references(() => characters.id),
  content: text("content").notNull(),
  isIcAction: boolean("is_ic_action").default(true), // In-character vs out-of-character
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Events table
export const aiEvents = pgTable("ai_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type").notNull(), // news, mission, encounter, etc.
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  targetCharacter: integer("target_character").references(() => characters.id),
  targetLocation: integer("target_location").references(() => locations.id),
  choices: jsonb("choices"), // Array of choice objects
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Character event responses
export const characterEventResponses = pgTable("character_event_responses", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => characters.id),
  eventId: integer("event_id").notNull().references(() => aiEvents.id),
  choiceIndex: integer("choice_index"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromCharacter: integer("from_character").references(() => characters.id),
  toCharacter: integer("to_character").notNull().references(() => characters.id),
  senderName: varchar("sender_name"), // For system/NPC messages
  subject: varchar("subject"),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("personal"), // personal, faction, corporate, system
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  factionReputations: many(characterFactionReputation),
  stockHoldings: many(stockHoldings),
  threadPosts: many(threadPosts),
  createdThreads: many(locationThreads),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  eventResponses: many(characterEventResponses),
}));

export const factionsRelations = relations(factions, ({ many }) => ({
  characterReputations: many(characterFactionReputation),
}));

export const corporationsRelations = relations(corporations, ({ many }) => ({
  stockHoldings: many(stockHoldings),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  threads: many(locationThreads),
}));

export const locationThreadsRelations = relations(locationThreads, ({ one, many }) => ({
  location: one(locations, {
    fields: [locationThreads.locationId],
    references: [locations.id],
  }),
  creator: one(characters, {
    fields: [locationThreads.createdBy],
    references: [characters.id],
  }),
  posts: many(threadPosts),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationThreadSchema = createInsertSchema(locationThreads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThreadPostSchema = createInsertSchema(threadPosts).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Faction = typeof factions.$inferSelect;
export type Corporation = typeof corporations.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type LocationThread = typeof locationThreads.$inferSelect;
export type ThreadPost = typeof threadPosts.$inferSelect;
export type InsertThreadPost = z.infer<typeof insertThreadPostSchema>;
export type AIEvent = typeof aiEvents.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
