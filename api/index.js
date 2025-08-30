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
[Generate 2-4 rows based on conditions provided]
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
[Generate 3-5 rows of allied health goals]
</tbody>
</table>

<p style="text-align: center; font-size: 12px; color: #7f8c8d; margin-top: 30px;">
<strong>Generated under MBS Guidelines effective July 1, 2025</strong><br>
This is a clinical decision support tool. All generated content must be reviewed and finalized by the treating practitioner.
</p>
</div>

Generate complete HTML tables with actual patient-specific content for these conditions: ${conditions}

Each table cell should contain complete, professional medical content. Use SMART goals with specific timeframes (3-6 months). Include specific referral details, contact information, and follow-up schedules.`;
