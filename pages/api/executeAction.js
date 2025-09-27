import { ethers } from 'ethers';
import { SHOW_CONTRACT_ABI, SHOW_CONTRACT_ADDRESS } from '../../../abi/ShowContract';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, parameters, showId } = req.body;

  // Validate input
  if (!action || !parameters || !showId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: action, parameters, and showId are required' 
    });
  }

  try {
    console.log(`Executing action: ${action} with parameters: ${parameters.join(', ')} in show ${showId}...`);

    // Route to appropriate tool API
    let toolEndpoint = '';
    let requestBody = { showId };

    switch (action) {
      case 'argue':
        if (parameters.length !== 2) {
          return res.status(400).json({ error: 'argue action requires exactly 2 parameters' });
        }
        toolEndpoint = '/api/tools/argue';
        requestBody = { agentA: parameters[0], agentB: parameters[1], showId };
        break;

      case 'form_alliance':
        if (parameters.length !== 2) {
          return res.status(400).json({ error: 'form_alliance action requires exactly 2 parameters' });
        }
        toolEndpoint = '/api/tools/form_alliance';
        requestBody = { agentA: parameters[0], agentB: parameters[1], showId };
        break;

      case 'betray':
        if (parameters.length !== 2) {
          return res.status(400).json({ error: 'betray action requires exactly 2 parameters' });
        }
        toolEndpoint = '/api/tools/betray';
        requestBody = { betrayerAgent: parameters[0], betrayedAgent: parameters[1], showId };
        break;

      case 'perform_task':
        if (parameters.length !== 1) {
          return res.status(400).json({ error: 'perform_task action requires exactly 1 parameter' });
        }
        toolEndpoint = '/api/tools/perform_task';
        requestBody = { agentId: parameters[0], showId };
        break;

      case 'gossip':
        if (parameters.length !== 2) {
          return res.status(400).json({ error: 'gossip action requires exactly 2 parameters' });
        }
        toolEndpoint = '/api/tools/gossip';
        requestBody = { gossiperAgent: parameters[0], targetAgent: parameters[1], showId };
        break;

      case 'audience_vote':
        if (parameters.length !== 1) {
          return res.status(400).json({ error: 'audience_vote action requires exactly 1 parameter' });
        }
        toolEndpoint = '/api/tools/audience_vote';
        requestBody = { agentId: parameters[0], showId };
        break;

      case 'random_event':
        if (parameters.length !== 1) {
          return res.status(400).json({ error: 'random_event action requires exactly 1 parameter' });
        }
        toolEndpoint = '/api/tools/random_event';
        requestBody = { agentId: parameters[0], showId };
        break;

      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}`,
          validActions: ['argue', 'form_alliance', 'betray', 'perform_task', 'gossip', 'audience_vote', 'random_event']
        });
    }

    // Execute the tool by making internal API call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const toolResponse = await fetch(`${baseUrl}${toolEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!toolResponse.ok) {
      const errorData = await toolResponse.json();
      return res.status(toolResponse.status).json({
        success: false,
        error: `Tool execution failed: ${errorData.error}`,
        details: errorData.details
      });
    }

    const toolResult = await toolResponse.json();

    res.status(200).json({
      success: true,
      message: `Action ${action} executed successfully`,
      action: action,
      parameters: parameters,
      toolResult: toolResult
    });

  } catch (error) {
    console.error('Error executing action:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: error.message
    });
  }
}
