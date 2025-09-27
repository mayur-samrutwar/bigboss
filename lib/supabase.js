import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// News management functions
export const addNews = async (newsData) => {
  const { data, error } = await supabase
    .from('news_updates')
    .insert([newsData])
    .select();
  
  if (error) {
    throw new Error(`Failed to add news: ${error.message}`);
  }
  
  return data[0];
};

export const getAgentNews = async (showId, agentId) => {
  const { data, error } = await supabase
    .from('news_updates')
    .select('*')
    .eq('show_id', showId)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get agent news: ${error.message}`);
  }
  
  return data;
};

export const getShowNews = async (showId) => {
  const { data, error } = await supabase
    .from('news_updates')
    .select('*')
    .eq('show_id', showId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get show news: ${error.message}`);
  }
  
  return data;
};

export const pollNews = async (showId, lastPollTime) => {
  const { data, error } = await supabase
    .from('news_updates')
    .select('*')
    .eq('show_id', showId)
    .gt('created_at', lastPollTime)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to poll news: ${error.message}`);
  }
  
  return data;
};

export const markNewsAsRead = async (newsId) => {
  const { data, error } = await supabase
    .from('news_updates')
    .update({ is_read: true })
    .eq('id', newsId)
    .select();
  
  if (error) {
    throw new Error(`Failed to mark news as read: ${error.message}`);
  }
  
  return data[0];
};
