require('dotenv').config();
const { CohereClient } = require('cohere-ai');

const co = new CohereClient({ apiKey: process.env.CO_API_KEY });

async function testCohere() {
  try {
    const response = await co.chat({
      model: 'command',       // "command" model works for most accounts
      message: 'Hello Cohere, are you working?',
      max_tokens: 50
    });

    console.log('✅ Cohere API is working!');
    console.log('Full response:', response);

    // Safely print the first message if available
    if (response?.output?.length > 0) {
      console.log('AI reply:', response.output[0].content);
    } else if (response?.reply) {
      console.log('AI reply:', response.reply);
    } else {
      console.log('No reply found in response');
    }
  } catch (err) {
    console.error('❌ Cohere Chat API error:', err);
  }
}

testCohere();
