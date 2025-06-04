import { printDistribution } from '../utils/analysisService.js';

async function main() {
  try {
    // Analyze from output.json (default behavior)
    await printDistribution();

    // TODO: In a real scenario, you would get the last service call output from your API
    // For now, we'll just show the default analysis
    // Example of how you would use it with last service output:
    // const lastServiceOutput = await fetchLastServiceOutput();
    // await printDistribution(lastServiceOutput, 'Last Service Call Distribution Analysis');
  } catch (error) {
    console.error('Error running analysis:', error);
    process.exit(1);
  }
}

main().catch(console.error); 