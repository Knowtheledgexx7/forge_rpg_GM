import OpenAI from "openai";
import { storage } from "../storage";
import type { Character, AIEvent } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY 
});

interface AIChoice {
  text: string;
  type: "investigate" | "avoid" | "confront" | "negotiate" | "custom";
  consequences?: string;
}

interface AIEventData {
  title: string;
  description: string;
  choices: AIChoice[];
  eventType: "news" | "encounter" | "mission" | "intrigue" | "personal";
  urgency: "low" | "medium" | "high";
}

export class AIGameMaster {
  private static instance: AIGameMaster;
  
  public static getInstance(): AIGameMaster {
    if (!AIGameMaster.instance) {
      AIGameMaster.instance = new AIGameMaster();
    }
    return AIGameMaster.instance;
  }

  async generatePersonalEvent(character: Character): Promise<AIEventData> {
    const prompt = `You are an AI GameMaster for a Star Wars MMO. Generate a dynamic personal event for this character:

Character: ${character.name}
Species: ${character.species}
Homeworld: ${character.homeworld}
Current Location: ${character.currentLocation}
Allegiance: ${character.allegiance}
Force Alignment: ${character.forceAlignment} (-1=Dark, 0=Neutral, 1=Light)
Credits: ${character.credits}

Create an immersive Star Wars event that:
1. Fits the character's current situation and location
2. Offers meaningful choices with consequences
3. Advances character development or plot
4. Maintains Star Wars lore authenticity

Respond in JSON format: {
  "title": "Event title",
  "description": "Detailed event description (2-3 sentences)",
  "choices": [
    {"text": "Choice description", "type": "investigate|avoid|confront|negotiate|custom", "consequences": "Brief consequence hint"},
    {"text": "Choice description", "type": "investigate|avoid|confront|negotiate|custom", "consequences": "Brief consequence hint"},
    {"text": "Choice description", "type": "investigate|avoid|confront|negotiate|custom", "consequences": "Brief consequence hint"}
  ],
  "eventType": "encounter|mission|intrigue|personal",
  "urgency": "low|medium|high"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Star Wars AI GameMaster. Create immersive, lore-accurate events with meaningful choices. Always respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const eventData = JSON.parse(response.choices[0].message.content || "{}");
      return eventData as AIEventData;
    } catch (error) {
      console.error("AI GameMaster error:", error);
      return this.getFallbackEvent(character);
    }
  }

  async generateNewsEvent(): Promise<AIEventData> {
    const prompt = `Generate a galactic news event for a Star Wars MMO that affects the broader galaxy:

Create an event involving:
- Corporate intrigue (CSA, Kuat Drive Yards, Sienar Fleet Systems, etc.)
- Political developments (Empire, Rebellion, neutral systems)
- Economic impacts (trade routes, resource discoveries, market shifts)
- Criminal underworld activities (Hutt Cartel, Black Sun, etc.)

Respond in JSON format: {
  "title": "News headline",
  "description": "Detailed news report (2-3 sentences)",
  "choices": [],
  "eventType": "news",
  "urgency": "low|medium|high"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Star Wars galactic news reporter. Create realistic, immersive news that affects the MMO economy and politics. Always respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const eventData = JSON.parse(response.choices[0].message.content || "{}");
      return eventData as AIEventData;
    } catch (error) {
      console.error("AI news generation error:", error);
      return this.getFallbackNewsEvent();
    }
  }

  async processEventChoice(character: Character, event: AIEvent, choiceIndex: number): Promise<{
    outcome: string;
    reputationChanges?: Array<{ factionName: string; change: number }>;
    creditChange?: number;
    forceAlignmentChange?: number;
  }> {
    const choices = event.choices as AIChoice[];
    const selectedChoice = choices[choiceIndex];

    const prompt = `Character ${character.name} chose: "${selectedChoice.text}" for event: "${event.title}"

Character details:
- Species: ${character.species}
- Allegiance: ${character.allegiance}
- Force Alignment: ${character.forceAlignment}
- Current Location: ${character.currentLocation}
- Credits: ${character.credits}

Generate the outcome and consequences in JSON format: {
  "outcome": "Detailed narrative outcome (2-3 sentences)",
  "reputationChanges": [{"factionName": "Empire|Rebel Alliance|CSA|Hutt Cartel", "change": -10 to +10}],
  "creditChange": -5000 to +5000,
  "forceAlignmentChange": -0.1 to +0.1
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI GameMaster calculating the consequences of player choices in Star Wars. Be fair but meaningful with consequences. Always respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("AI choice processing error:", error);
      return {
        outcome: "Your choice has been noted, but the full consequences remain to be seen...",
        creditChange: 0,
        forceAlignmentChange: 0,
      };
    }
  }

  async generateNPCDialogue(npcName: string, context: string, playerMessage?: string): Promise<string> {
    const prompt = `You are ${npcName}, an NPC in a Star Wars roleplay setting.
Context: ${context}
${playerMessage ? `Player said: "${playerMessage}"` : "Generate an opening dialogue."}

Respond as ${npcName} would, staying in character and maintaining Star Wars atmosphere. Keep responses concise (1-2 sentences).`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Star Wars NPC roleplayer. Stay in character, maintain lore accuracy, and create engaging dialogue."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 150,
      });

      return response.choices[0].message.content || "The NPC seems lost in thought...";
    } catch (error) {
      console.error("NPC dialogue generation error:", error);
      return "The comm system crackles with static...";
    }
  }

  private getFallbackEvent(character: Character): AIEventData {
    const events = [
      {
        title: "Suspicious Activity",
        description: `While walking through ${character.currentLocation}, you notice someone following you. They seem to be keeping their distance, but their intent is unclear.`,
        choices: [
          { text: "Confront them directly", type: "confront" as const, consequences: "May lead to conflict" },
          { text: "Try to lose them in the crowd", type: "avoid" as const, consequences: "Safer but may miss information" },
          { text: "Double back and follow them", type: "investigate" as const, consequences: "Risky but informative" }
        ],
        eventType: "encounter" as const,
        urgency: "medium" as const
      },
      {
        title: "Lucrative Opportunity",
        description: "A well-dressed stranger approaches with what appears to be a profitable job offer. The credits are good, but something feels off about the whole situation.",
        choices: [
          { text: "Accept the job immediately", type: "custom" as const, consequences: "Quick credits but unknown risks" },
          { text: "Ask for more details", type: "investigate" as const, consequences: "More information but may raise suspicion" },
          { text: "Politely decline", type: "avoid" as const, consequences: "Safe but miss potential opportunity" }
        ],
        eventType: "mission" as const,
        urgency: "low" as const
      }
    ];

    return events[Math.floor(Math.random() * events.length)];
  }

  private getFallbackNewsEvent(): AIEventData {
    const newsEvents = [
      {
        title: "Corporate Sector Authority Expansion",
        description: "CSA forces have established new checkpoints across three Outer Rim systems. Trade routes through Bonadan and Ammuud now require additional permits, causing market volatility.",
        choices: [],
        eventType: "news" as const,
        urgency: "medium" as const
      },
      {
        title: "Hutt Cartel Territory Dispute",
        description: "Fighting has broken out between rival Hutt clans over control of spice routes. Several shipping lanes have been temporarily closed, affecting galactic commerce.",
        choices: [],
        eventType: "news" as const,
        urgency: "high" as const
      }
    ];

    return newsEvents[Math.floor(Math.random() * newsEvents.length)];
  }
}

export const aiGameMaster = AIGameMaster.getInstance();
