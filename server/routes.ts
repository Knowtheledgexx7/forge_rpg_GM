import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiGameMaster } from "./services/aiGameMaster";
import { marketService } from "./services/marketService";
import { insertCharacterSchema, insertThreadPostSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Character routes
  app.get('/api/character', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      // Get faction reputations
      const factionReputations = await storage.getCharacterFactionReputations(character.id);
      
      res.json({
        ...character,
        factionReputations,
      });
    } catch (error) {
      console.error("Error fetching character:", error);
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });

  app.post('/api/character', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const characterData = insertCharacterSchema.parse({
        ...req.body,
        userId,
      });

      const character = await storage.createCharacter(characterData);
      res.json(character);
    } catch (error) {
      console.error("Error creating character:", error);
      res.status(500).json({ message: "Failed to create character" });
    }
  });

  // Faction routes
  app.get('/api/factions', async (req, res) => {
    try {
      const factions = await storage.getAllFactions();
      res.json(factions);
    } catch (error) {
      console.error("Error fetching factions:", error);
      res.status(500).json({ message: "Failed to fetch factions" });
    }
  });

  // Corporation routes
  app.get('/api/corporations', async (req, res) => {
    try {
      const corporations = await storage.getAllCorporations();
      res.json(corporations);
    } catch (error) {
      console.error("Error fetching corporations:", error);
      res.status(500).json({ message: "Failed to fetch corporations" });
    }
  });

  app.get('/api/market/summary', async (req, res) => {
    try {
      const summary = await marketService.getMarketSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching market summary:", error);
      res.status(500).json({ message: "Failed to fetch market summary" });
    }
  });

  // Location routes
  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.get('/api/locations/:locationId/threads', async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      const threads = await storage.getLocationThreads(locationId);
      res.json(threads);
    } catch (error) {
      console.error("Error fetching location threads:", error);
      res.status(500).json({ message: "Failed to fetch location threads" });
    }
  });

  app.post('/api/locations/:locationId/threads', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const locationId = parseInt(req.params.locationId);
      const { title, description } = req.body;

      const thread = await storage.createLocationThread({
        locationId,
        title,
        description,
        createdBy: character.id,
        isActive: true,
      });

      res.json(thread);
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ message: "Failed to create thread" });
    }
  });

  app.get('/api/threads/:threadId/posts', async (req, res) => {
    try {
      const threadId = parseInt(req.params.threadId);
      const posts = await storage.getThreadPosts(threadId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching thread posts:", error);
      res.status(500).json({ message: "Failed to fetch thread posts" });
    }
  });

  app.post('/api/threads/:threadId/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const threadId = parseInt(req.params.threadId);
      const postData = insertThreadPostSchema.parse({
        ...req.body,
        threadId,
        characterId: character.id,
      });

      const post = await storage.createThreadPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // AI Events routes
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      const characterId = character?.id;

      const events = await storage.getActiveEvents(characterId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events/:eventId/respond', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const eventId = parseInt(req.params.eventId);
      const { choiceIndex, response } = req.body;

      // Get the event
      const events = await storage.getActiveEvents();
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Process the choice with AI
      const outcome = await aiGameMaster.processEventChoice(character, event, choiceIndex);

      // Record the response
      await storage.respondToEvent(character.id, eventId, choiceIndex, response);

      // Apply consequences
      if (outcome.creditChange) {
        await storage.updateCharacter(character.id, {
          credits: (character.credits || 0) + outcome.creditChange,
        });
      }

      if (outcome.forceAlignmentChange) {
        const newAlignment = Math.max(-1, Math.min(1, (character.forceAlignment || 0) + outcome.forceAlignmentChange));
        await storage.updateCharacter(character.id, {
          forceAlignment: newAlignment,
        });
      }

      // Update faction reputations
      if (outcome.reputationChanges) {
        for (const repChange of outcome.reputationChanges) {
          const factions = await storage.getAllFactions();
          const faction = factions.find(f => f.name === repChange.factionName);
          if (faction) {
            await storage.updateFactionReputation(character.id, faction.id, repChange.change);
          }
        }
      }

      res.json(outcome);
    } catch (error) {
      console.error("Error responding to event:", error);
      res.status(500).json({ message: "Failed to process event response" });
    }
  });

  // Generate new AI event (for testing/admin)
  app.post('/api/events/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const eventData = await aiGameMaster.generatePersonalEvent(character);
      
      const aiEvent = await storage.createAIEvent({
        eventType: eventData.eventType,
        title: eventData.title,
        description: eventData.description,
        targetCharacter: character.id,
        targetLocation: null,
        choices: eventData.choices,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      res.json(aiEvent);
    } catch (error) {
      console.error("Error generating AI event:", error);
      res.status(500).json({ message: "Failed to generate AI event" });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const messages = await storage.getCharacterMessages(character.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const character = await storage.getCharacterByUserId(userId);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromCharacter: character.id,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    // Add client to market service for real-time market updates
    marketService.addWebSocketClient(ws as any);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Start market simulation
  marketService.startMarketSimulation();

  // Periodic AI event generation
  setInterval(async () => {
    try {
      const newsEvent = await aiGameMaster.generateNewsEvent();
      await storage.createAIEvent({
        eventType: newsEvent.eventType,
        title: newsEvent.title,
        description: newsEvent.description,
        targetCharacter: null, // Global event
        targetLocation: null,
        choices: newsEvent.choices,
        isActive: true,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      });
      
      console.log(`Generated news event: ${newsEvent.title}`);
    } catch (error) {
      console.error("Error generating periodic news event:", error);
    }
  }, 10 * 60 * 1000); // Every 10 minutes

  return httpServer;
}
