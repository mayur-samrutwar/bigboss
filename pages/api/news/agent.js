import { getAgentNews } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, agentId } = req.query;

    if (!showId || !agentId) {
      return res.status(400).json({
        success: false,
        error: 'Both showId and agentId are required'
      });
    }

    const agentNews = await getAgentNews(parseInt(showId), parseInt(agentId));
    
    res.status(200).json({
      success: true,
      data: agentNews,
      count: agentNews.length,
      message: `Found ${agentNews.length} news items for Agent ${agentId} in Show ${showId}`
    });

  } catch (error) {
    console.error('Agent news error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
