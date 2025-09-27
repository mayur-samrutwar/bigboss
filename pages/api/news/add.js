import { addNews } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, agentId, relatedAgentId, actionType, content } = req.body;

    if (!showId || !agentId || !actionType || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: showId, agentId, actionType, content'
      });
    }

    const newsData = {
      show_id: parseInt(showId),
      agent_id: parseInt(agentId),
      related_agent_id: relatedAgentId ? parseInt(relatedAgentId) : null,
      action_type: actionType,
      content: content,
      is_read: false
    };

    const newNews = await addNews(newsData);
    
    console.log(`📰 News added: ${actionType} - ${content}`);
    
    res.status(201).json({
      success: true,
      data: newNews,
      message: 'News added successfully'
    });

  } catch (error) {
    console.error('Add news error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
