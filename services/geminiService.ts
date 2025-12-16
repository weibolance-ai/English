import { GoogleGenAI, Type } from "@google/genai";
import { ExerciseMode, VocabularyItem, WritingFeedback } from "../types";

const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

export const getTopicSuggestions = async (apiKey: string, currentInterest: string): Promise<string[]> => {
  const ai = getAI(apiKey);
  const prompt = `Based on the user's general interest: "${currentInterest || 'General'}", suggest 5 specific, thought-provoking topics suitable for an advanced English essay. The topics should be sophisticated (e.g., Philosophy, Tech Ethics, Art History). Output simple JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  if (!response.text) return ["The Impact of AI on Creativity", "Urbanization and Mental Health", "The Ethics of Genetic Engineering", "Minimalism in Modern Art", "Globalization vs. Local Identity"];
  return JSON.parse(response.text);
};

export const generateVocabulary = async (apiKey: string, topic: string, level: string): Promise<VocabularyItem[]> => {
  const ai = getAI(apiKey);
  const prompt = `Topic: ${topic}. Target Level: ${level}.
  Generate 12-15 high-quality, precise English content words (Nouns, Verbs, Adjectives, Adverbs only) that would be useful for writing a sophisticated paragraph about this topic. 
  Avoid generic words. Focus on C1/C2 level vocabulary.
  Provide a short definition in Simplified Chinese.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                word: { type: Type.STRING },
                pos: { type: Type.STRING, description: "Part of speech (n., v., adj., adv.)" },
                definition: { type: Type.STRING, description: "Definition in Simplified Chinese" }
            }
        }
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate vocabulary");
  return JSON.parse(response.text);
};

export const evaluateWriting = async (
  apiKey: string,
  topic: string,
  targetVocab: string[],
  userSubmission: string
): Promise<WritingFeedback> => {
  const ai = getAI(apiKey);

  const prompt = `
    Topic: "${topic}"
    Target Vocabulary to use: ${JSON.stringify(targetVocab)}
    User Submission: "${userSubmission}"

    Evaluate this writing sample strictly based on these three advanced learning objectives.
    **CRITICAL INSTRUCTION**: Your feedback must be **100% specific to the User Submission**. Do not provide generic writing advice or definitions. You must **quote the user's actual sentences** when providing critiques or suggestions.

    1. **Mastering English Syntax (攻克句法障碍)**:
       - **Analysis Goal**: Identify specific sentences in the submission that suffer from "Parataxis" (Chinese-style loose connections, comma splices) or lack logical hierarchy.
       - **Action**: Provide concrete examples of how to rewrite **THESE SPECIFIC SENTENCES** using "Hypotaxis" (subordination, participial phrases, complex structures) to create tighter logical flows.
       - **Constraint**: Do not just say "use more connectives". Show exactly where and how in the user's text.

    2. **Achieving Lexical Precision (提升词汇精度)**:
       - **Analysis Goal**: Scrutinize the user's word choices.
       - **Task A (Target Vocab)**: Check if the specific Target Vocabulary words were used correctly in context.
       - **Task B (General Precision)**: Identify specific words or phrases in the user's submission that are **imprecise, vague ("big", "good", "bad"), or awkward collocations** (e.g., "make a plan" -> "devise a plan").
       - **Action**: For Task B, extract the exact "Original" phrase from the text, provide a "Better Alternative" (C1/C2 level), and explain "Reason" (nuance/collocation).

    3. **Eliminating Fossilized Errors (扫除语法盲区)**:
       - **Analysis Goal**: Hunt for "Fossilized Errors" (specifically Articles and Prepositions) in the submission.
       - **Action**: List the specific error found, the correction, and a brief reason.

    Output Language: Simplified Chinese (use English for specific linguistic terms like Hypotaxis/Parataxis where helpful).
    Tone: Professional, rigorous, yet encouraging (Strict Coach persona).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are an elite English Writing Coach. Your mission is to help students achieve native-like fluency by focusing on 3 pillars: Syntax Logic (Hypotaxis vs Parataxis), Lexical Precision (Collocations/Nuance), and Fossilized Grammar Errors (Articles/Prepositions). Provide sharp, specific, and constructive feedback.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          generalAdvice: { type: Type.STRING, description: "Encouraging summary in Chinese" },
          syntax: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                comment: { type: Type.STRING, description: "Advice on logic/hypotaxis in Chinese" },
                examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Examples of how to improve specific sentences" }
            }
          },
          lexicon: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                comment: { type: Type.STRING, description: "Advice on precision/collocations in Chinese" },
                vocabUsageCheck: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT,
                        properties: {
                            word: { type: Type.STRING },
                            usedCorrectly: { type: Type.BOOLEAN },
                            comment: { type: Type.STRING, description: "Optional comment if used incorrectly or brilliantly" }
                        }
                    }
                },
                collocationCorrections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING, description: "The imprecise word/phrase from user text" },
                            betterAlternative: { type: Type.STRING, description: "More precise C1/C2 alternative" },
                            reason: { type: Type.STRING, description: "Why the alternative is better" }
                        }
                    }
                }
            }
          },
          grammar: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                comment: { type: Type.STRING, description: "Advice on articles/prepositions in Chinese" },
                corrections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            correction: { type: Type.STRING },
                            reason: { type: Type.STRING, description: "Why is this an error?" }
                        }
                    }
                }
            }
          }
        }
      }
    }
  });

  if (!response.text) throw new Error("Evaluation failed");
  return JSON.parse(response.text);
};