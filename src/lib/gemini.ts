import { GoogleGenAI } from '@google/genai';
import { generateRoleTemplate, TemplateParams } from './templates';
import { CampaignVariant } from './types';

export interface GenerationResult {
  variant: CampaignVariant;
  generationMode: 'AI-generated; reviewed by officer' | 'Template mode';
  modelUsed: string | null;
  durationMs: number;
}

export async function generateCampaignContent(
  params: TemplateParams
): Promise<GenerationResult> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    const templateVariant = generateRoleTemplate(params);
    return {
      variant: templateVariant,
      generationMode: 'Template mode',
      modelUsed: null,
      durationMs: Date.now() - startTime,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an enterprise cybersecurity awareness simulation designer.
Generate a realistic, harmless, role-specific spear-phishing test simulation for employee training.
CRITICAL SAFETY & ETHICS RULES:
- Use purely fictional entities and systems (e.g., 'Acme Enterprise Direct Deposit', 'Internal Repo Vault').
- NO real credentials harvesting, NO actual malicious links, NO real person impersonation.
- Render body as plain text only (NO HTML, NO markdown tags, NO code blocks).
- Produce a subject and plain text body.
Target Department: ${params.department}
Scenario: ${params.scenario}
Difficulty: ${params.difficulty}
Context/Adaptation Reason: ${params.adaptationReason || 'Baseline scenario'}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nRespond ONLY in valid JSON matching this schema:
{
  "subject": "Email Subject Line",
  "body": "Plain text email body with a call-to-action button prompt"
}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    if (parsed.subject && parsed.body) {
      return {
        variant: {
          job_role: params.department.toLowerCase().includes('payroll')
            ? 'Payroll Specialist'
            : 'Senior Staff Engineer',
          department_name: params.department,
          subject: String(parsed.subject).trim(),
          body: String(parsed.body).trim(),
          adaptation_reason:
            params.adaptationReason ||
            `AI generated for ${params.department} at ${params.difficulty} difficulty.`,
        },
        generationMode: 'AI-generated; reviewed by officer',
        modelUsed: modelName,
        durationMs: Date.now() - startTime,
      };
    }

    throw new Error('Invalid JSON response shape from Gemini model');
  } catch (error) {
    console.warn('Gemini generation failed or timed out, falling back to template mode:', error);
    const templateVariant = generateRoleTemplate(params);
    return {
      variant: templateVariant,
      generationMode: 'Template mode',
      modelUsed: null,
      durationMs: Date.now() - startTime,
    };
  }
}
