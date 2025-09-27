import { pollNews } from '../../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { showId, lastPollTime } = req.query;

    if (!showId) {
      return res.status(400).json({
        success: false,
        error: 'showId is required'
      });
    }

    if (!lastPollTime) {
      return res.status(400).json({
        success: false,
        error: 'lastPollTime is required'
      });
    }

    const newNews = await pollNews(parseInt(showId), lastPollTime);
    
    res.status(200).json({
      success: true,
      hasNewNews: newNews.length > 0,
      count: newNews.length,
      data: newNews,
      message: newNews.length > 0 ? 
        `🚨 ${newNews.length} new update${newNews.length > 1 ? 's' : ''} in the show!` : 
        'No new updates'
    });

  } catch (error) {
    console.error('News poll error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
