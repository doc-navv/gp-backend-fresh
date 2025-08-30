export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'GP Care Plan API is running!', 
      timestamp: new Date().toISOString() 
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { conditions } = req.body || {};
    
    if (!conditions) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient conditions are required' 
      });
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    const prompt = `Act as an experienced Australian General Practitioner creating a GP Chronic Condition Management Plan (GPCCMP) under the current MBS guidelines (effective from July 1, 2025).

I will provide you with a list of the patient's chronic conditions.

Generate structured output in Microsoft Word format with clean, black and white table formatting:

## 📋 Table 1: GP Chronic Condition Management Plan

Create a Word table with the following exact format:

| Patient problems/needs/relevant conditions | Goals – changes to be achieved | Required treatments and services including patient actions | Arrangements for treatments/services (when, who, contact details) |
|---|---|---|---|
| [Condition 1] | [SMART goal with timeframe] | [Planned interventions, services, lifestyle advice, patient actions] | [Referrals, follow-up schedule, contact details] |
| [Condition 2] | [SMART goal with timeframe] | [Planned interventions, services, lifestyle advice, patient actions] | [Referrals, follow-up schedule, contact details] |
| [Condition 3] | [SMART goal with timeframe] | [Planned interventions, services, lifestyle advice, patient actions] | [Referrals, follow-up schedule, contact details] |

## 📋 Table 2: Allied Health Professional Arrangements

Create a Word table with this exact format:

| Goals – changes to be achieved | Required treatments and services including patient actions | Arrangements for treatments/services (when, who, contact details) |
|---|---|---|
| 1. [SMART allied health goal] | [Specific interventions and patient actions] | [Provider type, frequency, duration, contact method] |
| 2. [SMART allied health goal] | [Specific interventions and patient actions] | [Provider type, frequency, duration, contact method] |
| 3. [SMART allied health goal] | [Specific interventions and patient actions] | [Provider type, frequency, duration, contact method] |
| 4. [SMART allied health goal] | [Specific interventions and patient actions] | [Provider type, frequency, duration, contact method] |
| 5. [SMART allied health goal] | [Specific interventions and patient actions] | [Provider type, frequency, duration, contact method] |

**Requirements:**
- Each goal must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound) with clear 3-6 month timeframes
- Include evidence-based interventions appropriate to each condition
- Specify relevant lifestyle modifications and clear patient responsibilities
- Include appropriate allied health referrals (physiotherapy, dietitian, podiatry, etc.)
- Add specific review and monitoring schedules in the 'Arrangements' column
- Use professional medical terminology appropriate for MBS documentation
- Keep each cell concise but comprehensive for clinical practice
- Include document header: "GP Chronic Condition Management Plan - [Date]"
- Add footer with: "Generated under MBS Guidelines effective July 1, 2025"

My conditions are: ${conditions}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      carePlan: data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate care plan. Please try again.' 
    });
  }
}
