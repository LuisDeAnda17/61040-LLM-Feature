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
Pset#0              9/4
Pset#1              10/5
Pset#2              11/6
Pset#3              12/7
`;

const syllabus2 = `
Technical Lectures and Laboratory Schedule:

Week
Lecture Dates
Lecture topic
Lab

Week1
Feb 3, Feb 5
Introduction, architectures, ROS
Lab1a-b: Linux, Git


Week2
Feb 10, 12
Geometry, more ROS
Lab1c: ROS

3
Feb 18, 19
Control and kinematics
Lab 2: wall following (simulation) 


4
Feb 24, 26
Sensing
Lab 3: wall following (racecar)

The schedule of the Advanced topics and Use Cases is subject to change. Advanced Topics and Use Cases lectures will be decided depending on interest and guest lecturers.

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
    console.log('\n🧪 TEST CASE 2: LLM-Assisted Scheduling');
    console.log('========================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Robotics: Science and Systems", "Hello");
    const classId = cls.id;
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    brontoBoard.addSyllabus(syllabus2);

    brontoBoard.findAssignments(classId, llm);

    const all = brontoBoard.getAllAssignments(classId);
    if(!(brontoBoard.getAllAssignments(classId).length === 4 )){
        // console.log(`${brontoBoard.getAllAssignments(classId).length}`)
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
    brontoBoard.addSyllabus(syllabus);

}

export async function testLLMScheduling2(): Promise<void> {
    console.log('\n🧪 TEST CASE 4: LLM-Assisted Assignment Finding');
    console.log('========================================');
    
    const brontoBoard = new BrontoBoard();
    const cls = brontoBoard.createClass("Physics 101", "Hello");
    const classId = cls.id;
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    brontoBoard.addSyllabus(syllabus);

    brontoBoard.findAssignments(classId, llm);

    const all = brontoBoard.getAllAssignments(classId);
    if(!(brontoBoard.getAllAssignments(classId).length === 3 && (all[0].name ==="Pset#1" ||all[0].name === "Pset#2"||all[0].name ===  "Pset#3"))){
        console.log(`${brontoBoard.getAllAssignments(classId).length}`)
        throw new Error("findAssignments did not work as intended")
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
