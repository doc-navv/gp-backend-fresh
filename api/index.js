export default async function handler(req, res) {
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
        error: 'OpenAI API key not configured - please add OPENAI_API_KEY to environment variables' 
      });
    }
    
    console.log('API Key exists:', !!apiKey);
    console.log('Conditions received:', conditions);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ 
          role: 'user', 
          content: `Create a simple GP care plan for: ${conditions}` 
        }],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
    
    console.log('OpenAI Response Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Success! Generated care plan');
    
    return res.status(200).json({
      success: true,
      carePlan: data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Full Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to generate care plan: ${error.message}` 
    });
  }
}
