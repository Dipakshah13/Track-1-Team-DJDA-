/**
 * test-ollama.mjs
 * 
 * Verifies local Ollama + Gemma 4 model integration for Gemma Aegis.
 * Executes via Node.js as an ES Module (.mjs).
 */

import { Ollama } from 'ollama';

// Configuration: uses project environment variables if provided, with verified defaults
const OLLAMA_HOST = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL_TAG = process.env.LOCAL_MODEL || 'gemma4:e4b';

// Prompt relevant to Gemma Aegis AI firewall
const TEST_PROMPT = 'In 2-3 concise sentences, explain how an AI firewall safeguards private user data and prevents prompt injection attacks.';

async function runTest() {
  console.log('='.repeat(60));
  console.log('🛡️  Gemma Aegis - Local Ollama Integration Test');
  console.log('='.repeat(60));
  console.log(`📡 Connecting to Ollama at : ${OLLAMA_HOST}`);
  console.log(`🤖 Target Model Tag       : ${MODEL_TAG}`);
  console.log(`💬 Test Prompt             : "${TEST_PROMPT}"`);
  console.log('='.repeat(60));

  const client = new Ollama({ host: OLLAMA_HOST });

  // Step 1: Check connection and list available models
  let availableModels = [];
  try {
    const listResponse = await client.list();
    availableModels = (listResponse.models || []).map(m => m.name);
    console.log(`✅ Ollama service is reachable. Available models: [${availableModels.join(', ')}]`);
  } catch (err) {
    console.error('\n❌ Error: Unable to connect to local Ollama service.');
    console.error(`   Details: ${err.message || err}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure Ollama is installed and running.');
    console.error('   2. Start Ollama from PowerShell:');
    console.error('      ollama serve');
    console.error('   3. Verify accessibility in browser or terminal:');
    console.error(`      curl ${OLLAMA_HOST}`);
    process.exit(1);
  }

  // Step 2: Verify the target model is installed
  const modelFound = availableModels.some(name => 
    name === MODEL_TAG || name === `${MODEL_TAG}:latest` || name.startsWith(MODEL_TAG)
  );

  if (!modelFound) {
    console.error(`\n⚠️  Model "${MODEL_TAG}" was not found among installed models.`);
    console.error(`   Installed models found: ${availableModels.length > 0 ? availableModels.join(', ') : 'None'}`);
    console.error('\n💡 To pull the required model, run:');
    console.error(`   ollama pull ${MODEL_TAG}`);
    process.exit(1);
  }

  console.log(`✅ Model "${MODEL_TAG}" verified.\n`);
  console.log('Streaming response from Gemma 4:');
  console.log('-'.repeat(60));

  // Step 3: Stream response from model
  try {
    const responseStream = await client.chat({
      model: MODEL_TAG,
      messages: [
        {
          role: 'user',
          content: TEST_PROMPT
        }
      ],
      stream: true,
    });

    let fullResponse = '';
    for await (const chunk of responseStream) {
      const content = chunk?.message?.content || '';
      process.stdout.write(content);
      fullResponse += content;
    }

    console.log('\n' + '-'.repeat(60));
    console.log('🎉 Integration Test Successful! Ollama and Gemma 4 are working properly.\n');
  } catch (err) {
    console.error('\n\n❌ Error during model execution/streaming:');
    console.error(`   Details: ${err.message || err}`);
    if (err.status_code === 404 || err.status === 404) {
      console.error(`\n💡 The model "${MODEL_TAG}" was not found by the Ollama runner.`);
      console.error(`   Run: ollama pull ${MODEL_TAG}`);
    } else {
      console.error('\n💡 If Ollama ran out of memory (VRAM/RAM), ensure no other heavy models are running:');
      console.error('   ollama ps');
      console.error('   ollama stop <model_name>');
    }
    process.exit(1);
  }
}

runTest();
