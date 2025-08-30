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

IMPORTANT: Generate the response as clean HTML tables that will display properly in web browsers and export cleanly to Word/PDF format.

Create exactly this structure:

<div style="font-family: Arial, sans-serif; max-width: 800px;">
<h2 style="text-align: center; color: #2c3e50;">GP Chronic Condition Management Plan</h2>
<p style="text-align: center; color: #7f8c8d;">${new Date().toLocaleDateString('en-AU')}</p>

<h3 style="color: #2980b9;">📋 Table 1: GP Chronic Condition Management Plan</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #34495e;">
<thead>
<tr style="background-color: #ecf0f1;">
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Patient problems/needs/relevant conditions</th>
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Goals – changes to be achieved</th>
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Required treatments and services including patient actions</th>
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Arrangements for treatments/services (when, who, contact details)</th>
</tr>
</thead>
<tbody>

For each condition provided, create table rows with this exact format:
<tr>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[Specific condition name]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[SMART goal with specific timeframe - 3 to 6 months]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">
• [Treatment/intervention 1]<br>
• [Treatment/intervention 2]<br>
• [Patient education/actions]<br>
• [Lifestyle modifications]
</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">
• [Referral details with contact info]<br>
• [Follow-up schedule]<br>
• [Monitoring arrangements]
</td>
</tr>

</tbody>
</table>

<h3 style="color: #2980b9;">📋 Table 2: Allied Health Professional Arrangements</h3>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #34495e;">
<thead>
<tr style="background-color: #ecf0f1;">
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Goals – changes to be achieved</th>
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Required treatments and services including patient actions</th>
<th style="border: 1px solid #bdc3c7; padding: 12px; text-align: left; font-weight: bold;">Arrangements for treatments/services (when, who, contact details)</th>
</tr>
</thead>
<tbody>

Create 3-5 allied health goals with this format:
<tr>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[SMART allied health goal]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">
• [Specific intervention]<br>
• [Patient responsibilities]<br>
• [Expected outcomes]
</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">
• [Provider type and contact details]<br>
• [Frequency and duration]<br>
• [Review schedule]
</td>
</tr>

</tbody>
</table>

<p style="text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 30px;">
<strong>Generated under MBS Guidelines effective July 1, 2025</strong><br>
This is a clinical decision support tool. All generated content must be reviewed and finalized by the treating practitioner.
</p>
</div>

Requirements:
- Generate complete HTML tables with actual patient-specific content
- Use SMART goals with specific timeframes (3-6 months)
- Include specific referral details and contact information
- Add follow-up schedules and monitoring arrangements
- Use evidence-based interventions appropriate for Australian clinical practice
- Ensure compliance with MBS chronic disease management requirements

Patient conditions: ${conditions}`;
    
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
