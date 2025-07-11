import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  species: z.string().min(1, "Species is required"),
  homeworld: z.string().min(1, "Homeworld is required"),
  allegiance: z.string().default("Neutral"),
  forceSensitive: z.boolean().default(false),
  currentLocation: z.string().min(1, "Starting location is required"),
  biography: z.string().max(1000, "Biography too long").optional(),
});

type CharacterForm = z.infer<typeof characterSchema>;

const species = [
  "Human", "Twi'lek", "Rodian", "Zabrak", "Togruta", "Bothan", 
  "Wookiee", "Sullustanese", "Mon Calamari", "Corellian", "Duros"
];

const homeworlds = [
  "Coruscant", "Tatooine", "Alderaan", "Naboo", "Corellia", "Ryloth",
  "Kashyyyk", "Mon Cala", "Sullust", "Bothawui", "Duros", "Nar Shaddaa"
];

const allegiances = [
  "Neutral", "Empire", "Rebel Alliance", "Corporate Sector Authority", 
  "Hutt Cartel", "Independent"
];

const startingLocations = [
  "Coruscant - Senate District",
  "Nar Shaddaa - Smuggler's Moon",
  "Tatooine - Mos Eisley",
  "Corellia - Coronet City",
  "Naboo - Theed",
  "Ryloth - Lessu"
];

export default function CharacterCreation() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");

  const form = useForm<CharacterForm>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      species: "",
      homeworld: "",
      allegiance: "Neutral",
      forceSensitive: false,
      currentLocation: "",
      biography: "",
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterForm) => {
      const response = await apiRequest("POST", "/api/character", {
        ...data,
        avatar: selectedAvatar,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/character"] });
      toast({
        title: "Character Created",
        description: "Welcome to the galaxy! Your journey begins now.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharacterForm) => {
    createCharacterMutation.mutate(data);
  };

  const avatarOptions = [
    "fas fa-user", "fas fa-user-astronaut", "fas fa-user-ninja", 
    "fas fa-user-tie", "fas fa-helmet-battle", "fas fa-mask"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-imperial-gray border-corporate-gold/50 panel-glow">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-orbitron text-corporate-gold glow-text mb-2">
            <i className="fas fa-id-card mr-3"></i>
            Character Creation
          </CardTitle>
          <p className="text-gray-300 text-sm">
            Create your character and begin your journey in the galaxy far, far away...
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Character Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-corporate-gold font-orbitron">Character Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-panel-gray border-corporate-gold/50 text-gray-200 focus:ring-corporate-gold"
                          placeholder="Enter character name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Species */}
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-corporate-gold font-orbitron">Species</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-panel-gray border-corporate-gold/50 text-gray-200">
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-panel-gray border-corporate-gold/50">
                          {species.map((s) => (
                            <SelectItem key={s} value={s} className="text-gray-200">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Homeworld */}
                <FormField
                  control={form.control}
                  name="homeworld"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-corporate-gold font-orbitron">Homeworld</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-panel-gray border-corporate-gold/50 text-gray-200">
                            <SelectValue placeholder="Select homeworld" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-panel-gray border-corporate-gold/50">
                          {homeworlds.map((hw) => (
                            <SelectItem key={hw} value={hw} className="text-gray-200">{hw}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Allegiance */}
                <FormField
                  control={form.control}
                  name="allegiance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-corporate-gold font-orbitron">Allegiance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-panel-gray border-corporate-gold/50 text-gray-200">
                            <SelectValue placeholder="Select allegiance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-panel-gray border-corporate-gold/50">
                          {allegiances.map((allegiance) => (
                            <SelectItem key={allegiance} value={allegiance} className="text-gray-200">
                              {allegiance}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Starting Location */}
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-corporate-gold font-orbitron">Starting Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-panel-gray border-corporate-gold/50 text-gray-200">
                          <SelectValue placeholder="Select starting location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-panel-gray border-corporate-gold/50">
                        {startingLocations.map((loc) => (
                          <SelectItem key={loc} value={loc} className="text-gray-200">{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Avatar Selection */}
              <div>
                <FormLabel className="text-corporate-gold font-orbitron mb-3 block">Character Avatar</FormLabel>
                <div className="grid grid-cols-6 gap-3">
                  {avatarOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedAvatar(icon)}
                      className={`p-4 ${
                        selectedAvatar === icon 
                          ? 'bg-corporate-gold text-space-dark' 
                          : 'bg-panel-gray border border-corporate-gold/50 text-corporate-gold'
                      } hover:bg-corporate-gold/20`}
                    >
                      <i className={`${icon} text-xl`}></i>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Force Sensitive */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="forceSensitive"
                  checked={form.watch("forceSensitive")}
                  onChange={(e) => form.setValue("forceSensitive", e.target.checked)}
                  className="w-4 h-4 text-corporate-gold border-corporate-gold/50 rounded focus:ring-corporate-gold"
                />
                <label htmlFor="forceSensitive" className="text-corporate-gold font-orbitron">
                  Force Sensitive
                </label>
                <Badge variant="outline" className="text-warning-yellow border-warning-yellow text-xs">
                  Rare Trait
                </Badge>
              </div>

              {/* Biography */}
              <FormField
                control={form.control}
                name="biography"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-corporate-gold font-orbitron">
                      Character Biography (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-panel-gray border-corporate-gold/50 text-gray-200 focus:ring-corporate-gold"
                        placeholder="Tell your character's backstory..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={createCharacterMutation.isPending}
                  className="flex-1 bg-corporate-gold text-space-dark font-orbitron font-bold hover:bg-corporate-gold/80 transition-all"
                >
                  {createCharacterMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Creating Character...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Create Character
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/api/logout'}
                  className="border-danger-red text-danger-red hover:bg-danger-red/20"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
