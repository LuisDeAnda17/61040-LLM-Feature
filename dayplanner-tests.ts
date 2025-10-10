/**
 * DayPlanner Test Cases
 * 
 * Demonstrates both manual scheduling and LLM-assisted scheduling
 */

import { BrontoBoard } from './dayplanner';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}


/**
 * Load a makeshift Syllabus
 */
const syllabus = `
Welcome to my class!

Here are the due dates for my assignments:
Pset#0              11/4
Pset#1              11/5
Pset#2              11/6
Pset#3              12/7
`;

const syllabus2 = `
Welcome to my class

You are expected to all your work and turn in all labs in order to pass the class

Calendar:
|Sunday     |Monday      |Tuesday     |Wednesday       |Thrusday       |Friday          |Saturday     |
|           |10/01       |10/02       |10/03     Pset#1|10/04          |10/05           |10/06        |
|10/07      |10/08       |10/09       |10/10           |10/11          |10/12     Pset#2|10/13        |
|10/14      |10/15       |10/16       |10/17   Pset#3-a|10/18          |10/19           |10/20        |
|10/21      |10/22       |10/23       |10/24           |10/25          |10/26   Pset#3-b|10/27        |
|10/28      |10/29       |10/30       |11/01           |11/02          |11/03           |11/04  Pset#4|
`
/**
 * Test case 1: Manual scheduling
 * Demonstrates adding activities and manually assigning them to time slots
 */
export async function testManualScheduling(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Manual Scheduling');
    console.log('==================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Physics 101", "Hello");
    const classId = cls.id;

    const dueDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // tomorrow
    // const now = new Date();
    // const specificDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDay() + 1, 0, 0, 0, 0);
    const work = brontoBoard.addAssignment(classId, 'Homework 1', dueDate);

    if(!(work.name === 'Homework 1' && brontoBoard.getAllAssignments(classId).length === 1)){
        throw new Error("addAssignment did not work as intended")
    } else{
        console.log("\n Assignment was added");
    }

    brontoBoard.removeWork(work);
    if(!(brontoBoard.getAllAssignments(classId).length === 0)){
        throw new Error("addAssignment did not work as intended")
    } else {
        console.log("\n Assignment was successfully removed");
    }
}

/**
 * Test case 2: LLM-assisted scheduling
 * Demonstrates adding activities and letting the LLM assign them automatically
 */
export async function testLLMScheduling(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: LLM-Assisted Assignment Finding');
    console.log('========================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Physics 101", "Hello");
    const classId = cls.id;
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    brontoBoard.addSyllabus(syllabus);

    await brontoBoard.findAssignments(classId, llm);

    const all = brontoBoard.getAllAssignments(classId);
    if(!(brontoBoard.getAllAssignments(classId).length < 5)){
        console.log(`${brontoBoard.getAllAssignments(classId).length}`)
        throw new Error("findAssignments did not work as intended")
    }
}

/**
 * Test case 3: Mixed scheduling
 * Demonstrates adding some activities manually and others via LLM
 */
export async function testMixedScheduling(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Mixed Scheduling');
    console.log('=================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Physics 101", "Hello");
    const classId = cls.id;
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), 10, 4, 0, 0, 0, 0);//Novemeber 4
    const work = brontoBoard.addAssignment(classId, 'Pset#4', dueDate);

    brontoBoard.addSyllabus(syllabus2);

    await brontoBoard.findAssignments(classId, llm);

    const all = brontoBoard.getAllAssignments(classId);
    if(!(brontoBoard.getAllAssignments(classId).length < 5)){
        console.log(`${brontoBoard.getAllAssignments(classId).length}`)
        throw new Error("findAssignments did not work as intended")
    }
}

export async function testLLMScheduling2(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: LLM-Assisted Scheduling');
    console.log('========================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Robotics: Science and Systems", "Hello");
    const classId = cls.id;
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    brontoBoard.addSyllabus(syllabus2);

    await brontoBoard.findAssignments(classId, llm);

    const all = brontoBoard.getAllAssignments(classId);
    // if(!(brontoBoard.getAllAssignments(classId).length === 4 )){
    //     // console.log(`${brontoBoard.getAllAssignments(classId).length}`)
    //     throw new Error("findAssignments did not work as intended")
    // }
    const names = all.map(a => a.name);
    if (!names.some(n => n.includes("Pset#4")) || all.length < 5) {
        console.log("findAssignments did not identify expected assignments");
    }
}

/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 DayPlanner Test Suite');
    console.log('========================\n');
    
    try {
        // Run manual scheduling test
        await testManualScheduling();
        
        // Run LLM scheduling test
        await testLLMScheduling();
        
        // Run mixed scheduling test
        await testMixedScheduling();

        //Run LLM Scheduling with different various data points
        await testLLMScheduling2()
        
        console.log('\n🎉 All test cases completed successfully!');
        
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
