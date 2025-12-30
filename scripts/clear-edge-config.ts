import axios from 'axios';

// Extract configuration ID from Edge Config URL
function getConfigIdFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.pathname.split('/')[1] || '';
  } catch (error) {
    return '';
  }
}

async function clearEdgeConfig() {
  if (!process.env.EDGE_CONFIG) {
    console.error('Error: EDGE_CONFIG environment variable is not set');
    process.exit(1);
  }

  if (!process.env.VERCEL_ACCESS_TOKEN) {
    console.error('Error: VERCEL_ACCESS_TOKEN environment variable is not set');
    process.exit(1);
  }

  const configId = getConfigIdFromUrl(process.env.EDGE_CONFIG);
  if (!configId) {
    console.error('Error: Could not extract config ID from EDGE_CONFIG URL');
    process.exit(1);
  }

  try {
    const response = await axios.delete(`https://api.vercel.com/v1/edge-config/${configId}/items`, {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
      },
      data: {
        items: ['members', 'tasks', 'taskAssignments', 'systemConfigs'],
      },
    });

    console.log('Successfully cleared Edge Config data:', response.data);
  } catch (error) {
    console.error('Error clearing Edge Config data:', error);
    process.exit(1);
  }
}

clearEdgeConfig(); 