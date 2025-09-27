import { supabase, addNews, getAgentNews, getShowNews, pollNews, markNewsAsRead } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        // Add new news
        const { show_id, agent_id, related_agent_id, action_type, content } = req.body;
        
        if (!show_id || !agent_id || !action_type || !content) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: show_id, agent_id, action_type, content'
          });
        }

        const newsData = {
          show_id,
          agent_id,
          related_agent_id: related_agent_id || null,
          action_type,
          content,
          is_read: false
        };

        const newNews = await addNews(newsData);
        
        res.status(201).json({
          success: true,
          data: newNews,
          message: 'News added successfully'
        });
        break;

      case 'GET':
        const { showId, agentId, lastPollTime } = req.query;

        if (!showId) {
          return res.status(400).json({
            success: false,
            error: 'showId is required'
          });
        }

        if (agentId) {
          // Get news for specific agent
          const agentNews = await getAgentNews(parseInt(showId), parseInt(agentId));
          res.status(200).json({
            success: true,
            data: agentNews,
            message: `Found ${agentNews.length} news items for agent ${agentId}`
          });
        } else if (lastPollTime) {
          // Poll for new news
          const newNews = await pollNews(parseInt(showId), lastPollTime);
          res.status(200).json({
            success: true,
            data: newNews,
            hasNewNews: newNews.length > 0,
            count: newNews.length,
            message: newNews.length > 0 ? `${newNews.length} new news items` : 'No new news'
          });
        } else {
          // Get all news for show
          const showNews = await getShowNews(parseInt(showId));
          res.status(200).json({
            success: true,
            data: showNews,
            message: `Found ${showNews.length} news items for show ${showId}`
          });
        }
        break;

      case 'PUT':
        // Mark news as read
        const { newsId } = req.body;
        
        if (!newsId) {
          return res.status(400).json({
            success: false,
            error: 'newsId is required'
          });
        }

        const updatedNews = await markNewsAsRead(parseInt(newsId));
        
        res.status(200).json({
          success: true,
          data: updatedNews,
          message: 'News marked as read'
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
