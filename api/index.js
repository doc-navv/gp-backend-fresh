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

Generate the response in this EXACT format:

<div style="font-family: Arial, sans-serif; max-width: 100%; padding: 20px;">

<h2 style="text-align: center; color: #2c3e50; margin-bottom: 5px;">GP Chronic Condition Management Plan – ${new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}</h2>

<p style="text-align: center; color: #7f8c8d; margin-bottom: 30px; font-size: 14px;">Based content on Australian clinical guidelines</p>

<h3 style="color: #2980b9; margin-bottom: 15px;">📋 Table 1: GP Chronic Condition Management Plan</h3>

<table style="width: 100%; border-collapse: collapse; border: 2px solid #34495e; margin-bottom: 30px;">
<tr style="background-color: #ecf0f1;">
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Patient problems / needs / relevant conditions</td>
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Goals – changes to be achieved</td>
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Required treatments and services including patient actions</td>
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Arrangements for treatments/services (when, who, contact details)</td>
</tr>

For each condition provided, generate table rows using this exact format:
<tr>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[Condition with specific clinical details - e.g., "Type 2 Diabetes Mellitus – suboptimal glycaemic control (HbA1c 8.2%)"]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[SMART goal with specific target and 3-6 month timeframe]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">- [Treatment 1]<br>- [Treatment 2]<br>- [Patient education/actions]<br>- [Lifestyle modifications]<br>- [Preventive care]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">- [GP: review schedule]<br>- [Specialist: type and frequency]<br>- [Allied health: type and frequency]<br>- [Investigations: type and frequency]<br>- [Other services: type and frequency]</td>
</tr>

</table>

<h3 style="color: #2980b9; margin-bottom: 15px;">📋 Table 2: Allied Health Professional Arrangements</h3>

<table style="width: 100%; border-collapse: collapse; border: 2px solid #34495e; margin-bottom: 30px;">
<tr style="background-color: #ecf0f1;">
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Goals – changes to be achieved</td>
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Required treatments and services including patient actions</td>
<td style="border: 1px solid #bdc3c7; padding: 12px; font-weight: bold;">Arrangements for treatments/services (when, who, contact details)</td>
</tr>

Generate 3-5 allied health goals using this exact format:
<tr>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[Specific SMART goal with timeframe]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">- [Patient action 1]<br>- [Patient action 2]<br>- [Patient responsibility 3]</td>
<td style="border: 1px solid #bdc3c7; padding: 10px; vertical-align: top;">[Professional type]: [frequency and duration], [follow-up method]</td>
</tr>

</table>

</div>

IMPORTANT FORMATTING RULES:
1. Use generic professional titles (GP, Dietitian, Diabetes Educator, Exercise Physiologist, etc.) - NO specific names
2. Use generic contact arrangements (monthly sessions, fortnightly visits, phone follow-up) - NO phone numbers or addresses
3. Include specific clinical targets and timeframes in goals
4. Use bullet points with "- " format in treatment columns
5. Keep arrangements professional but generic (e.g., "GP: review 3-monthly, phone follow-up for blood results")
6. Include relevant investigations and monitoring schedules
7. Base content on Australian clinical guidelines and MBS requirements

Patient conditions to address: ${conditions}`;
    
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
