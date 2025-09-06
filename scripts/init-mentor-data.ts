import { config } from 'dotenv';
import { mentorVectorizer } from '@/lib/pinecone/mentor-vectorizer';
import { pineconeIndexManager, cryptoMentorIndexConfig } from '@/lib/pinecone/index-manager';
import { fakeMentors } from '@/lib/data/fakeMentors';
import { logger } from '@/lib/logger/index';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

/**
 * Initialize Pinecone with fake mentor data for testing
 * Run this script to populate the Pinecone index with sample mentors
 */
async function initializeMentorData() {
  try {
    logger.info('Starting mentor data initialization...');

    // Check environment variables
    const pineconeKey = process.env.PINECONE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    
    console.log('🔧 Environment Check:');
    console.log(`  PINECONE_API_KEY: ${pineconeKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`  OPENROUTER_API_KEY: ${openrouterKey ? '✅ Set' : '❌ Missing'}`);
    
    if (!pineconeKey) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required for embeddings');
    }
    
    console.log('✅ Using OpenRouter for embeddings (text-embedding-ada-002)');

    // Step 1: Create Pinecone index if it doesn't exist
    logger.info('Creating Pinecone index if needed...');
    await pineconeIndexManager.createIndexIfNotExists(cryptoMentorIndexConfig);

    // Step 2: Wait a moment for index to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Check index stats before upload
    const statsBefore = await pineconeIndexManager.indexStats(cryptoMentorIndexConfig.name);
    logger.info('Index stats before upload:', statsBefore);

    // Step 4: Convert fake mentors to CryptoMentorProfile format and upload
    logger.info(`Converting and uploading ${fakeMentors.length} mentor profiles...`);
    
    // Upload mentors individually to handle any errors gracefully
    let successCount = 0;
    let errorCount = 0;

    for (const mentor of fakeMentors) {
      try {
        await mentorVectorizer.uploadMentor(mentor);
        successCount++;
        logger.info(`Successfully uploaded mentor: ${mentor.personal_info.fullName}`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errorCount++;
        logger.error(`Failed to upload mentor ${mentor.personal_info.fullName}:`, error);
      }
    }

    // Step 5: Check final stats
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing
    const statsAfter = await pineconeIndexManager.indexStats(cryptoMentorIndexConfig.name);
    logger.info('Index stats after upload:', statsAfter);

    // Step 6: Summary
    logger.info('Mentor data initialization completed!', {
      totalMentors: fakeMentors.length,
      successfulUploads: successCount,
      errors: errorCount,
      indexStats: statsAfter
    });

    if (successCount === fakeMentors.length) {
      console.log('✅ All mentors uploaded successfully!');
      console.log('🚀 Your Pinecone mentor database is ready for matching!');
    } else {
      console.log(`⚠️  ${successCount}/${fakeMentors.length} mentors uploaded successfully`);
      console.log('❌ Some mentors failed to upload. Check logs for details.');
    }

  } catch (error) {
    logger.error('Failed to initialize mentor data:', error);
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Clear all mentor data from Pinecone (for testing/reset)
 */
async function clearMentorData() {
  try {
    logger.info('Clearing all mentor data...');

    const index = await pineconeIndexManager.getIndex(cryptoMentorIndexConfig.name);
    
    // Clear all namespaces
    const namespaces = ['mentors-investor', 'mentors-developer', 'mentors-social-user', 'mentors-all'];
    
    for (const namespace of namespaces) {
      try {
        await pineconeIndexManager.clearNamespace(cryptoMentorIndexConfig.name, namespace);
        logger.info(`Cleared namespace: ${namespace}`);
      } catch (error) {
        logger.warn(`Failed to clear namespace ${namespace}:`, error);
      }
    }

    logger.info('Mentor data cleared successfully');
    console.log('🧹 All mentor data has been cleared from Pinecone');

  } catch (error) {
    logger.error('Failed to clear mentor data:', error);
    console.error('❌ Clear operation failed:', error);
  }
}

/**
 * Display current Pinecone index statistics
 */
async function showIndexStats() {
  try {
    const stats = await pineconeIndexManager.indexStats(cryptoMentorIndexConfig.name);
    logger.info('Current index statistics:', stats);
    
    console.log('\n📊 Pinecone Index Statistics:');
    console.log('================================');
    console.log(`Total vectors: ${stats.totalVectorCount || 0}`);
    console.log(`Dimension: ${stats.dimension || 'Unknown'}`);
    
    if (stats.namespaces) {
      console.log('\nNamespace breakdown:');
      Object.entries(stats.namespaces).forEach(([namespace, data]: [string, any]) => {
        console.log(`  ${namespace}: ${data.vectorCount || 0} vectors`);
      });
    }

  } catch (error) {
    logger.error('Failed to get index stats:', error);
    console.error('❌ Failed to get stats:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeMentorData();
    break;
  case 'clear':
    clearMentorData();
    break;
  case 'stats':
    showIndexStats();
    break;
  default:
    console.log('\n🤖 Mentor Data Management Script');
    console.log('================================');
    console.log('Available commands:');
    console.log('  npm run init-mentors init  - Initialize Pinecone with fake mentor data');
    console.log('  npm run init-mentors clear - Clear all mentor data from Pinecone');
    console.log('  npm run init-mentors stats - Show current index statistics');
    console.log('\nExample: npm run init-mentors init');
}