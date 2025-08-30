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

Generate clean, professional HTML tables optimized for both desktop and mobile viewing:

<div class="care-plan-document">
<div class="header-section">
<h2>GP Chronic Condition Management Plan</h2>
<p class="date-stamp">${new Date().toLocaleDateString('en-AU')}</p>
</div>

<div class="table-section">
<h3>📋 Table 1: GP Chronic Condition Management Plan</h3>
<div class="table-responsive">
<table class="care-plan-table">
<thead>
<tr>
<th class="col-condition">Patient problems/needs/relevant conditions</th>
<th class="col-goals">Goals – changes to be achieved</th>
<th class="col-treatments">Required treatments and services including patient actions</th>
<th class="col-arrangements">Arrangements for treatments/services (when, who, contact details)</th>
</tr>
</thead>
<tbody>

Generate 2-4 table rows based on the conditions, using this format:
<tr>
<td class="condition-cell"><strong>[Condition Name]</strong></td>
<td class="goals-cell">[SMART goal with 3-6 month timeframe]</td>
<td class="treatments-cell">
<ul class="treatment-list">
<li>[Treatment/intervention 1]</li>
<li>[Treatment/intervention 2]</li>
<li>[Patient education/actions]</li>
<li>[Lifestyle modifications]</li>
</ul>
</td>
<td class="arrangements-cell">
<ul class="arrangement-list">
<li>[Referral with contact info]</li>
<li>[Follow-up schedule]</li>
<li>[Monitoring arrangements]</li>
</ul>
</td>
</tr>

</tbody>
</table>
</div>
</div>

<div class="table-section">
<h3>📋 Table 2: Allied Health Professional Arrangements</h3>
<div class="table-responsive">
<table class="care-plan-table">
<thead>
<tr>
<th class="col-allied-goals">Goals – changes to be achieved</th>
<th class="col-allied-treatments">Required treatments and services including patient actions</th>
<th class="col-allied-arrangements">Arrangements for treatments/services (when, who, contact details)</th>
</tr>
</thead>
<tbody>

Generate 3-5 allied health goals:
<tr>
<td class="allied-goals-cell">[SMART allied health goal]</td>
<td class="allied-treatments-cell">
<ul class="treatment-list">
<li>[Specific intervention]</li>
<li>[Patient responsibilities]</li>
<li>[Expected outcomes]</li>
</ul>
</td>
<td class="allied-arrangements-cell">
<ul class="arrangement-list">
<li>[Provider type and contact]</li>
<li>[Frequency and duration]</li>
<li>[Review schedule]</li>
</ul>
</td>
</tr>

</tbody>
</table>
</div>
</div>

<div class="footer-section">
<p><strong>Generated under MBS Guidelines effective July 1, 2025</strong></p>
<p><em>This is a clinical decision support tool. All generated content must be reviewed and finalized by the treating practitioner.</em></p>
</div>
</div>

Requirements:
- Generate complete, evidence-based medical content
- Use SMART goals with specific 3-6 month timeframes  
- Include realistic Australian healthcare provider contacts
- Add specific follow-up schedules and monitoring plans
- Ensure MBS chronic disease management compliance
- Use professional medical terminology appropriate for GPs

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
