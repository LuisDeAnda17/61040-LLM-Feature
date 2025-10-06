/**
 * DayPlanner Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';

interface Assignment {
  id: string,
  name: string;
  dueDate: Date;
}

interface Class {
  id: string,
  name: string;
  overview: string;
  assignments: Assignment[];
}

export class BrontoBoard {
    private classes: Record<string, Class> = {};
    private syllabus: string = "";

    createClass(name: string, overview: string): Class {
        let id = crypto.randomUUID();
        let assignments: Assignment[] = []; 
        const newClass: Class = {
            id,
            name, 
            overview,
            assignments,
        };
        this.classes[id] = newClass;
        return newClass;
    }

    addSyllabus(syllabus: string): void{
        if (!syllabus || syllabus.trim().length === 0) {
            throw new Error("Syllabus cannot be empty.");
        }
        this.syllabus = syllabus.trim();
    }

    addAssignment(classid: string, workName: string, dueDate: Date): Assignment{
        this.ensureClassExists(classid);
        if (!workName.trim()) throw new Error("workName cannot be empty.");
        if (dueDate < new Date()) throw new Error("dueDate must be in the future.");
        const newWork: Assignment = {
            id: crypto.randomUUID(),
            name: workName,
            dueDate,
        };
        this.classes[classid].assignments.push(newWork)
        return newWork;
    } 

    changeAssignment(work: Assignment, newDueDate: Date): void {
        if (!work) throw new Error("Invalid assignment.");
        if (newDueDate < new Date()) throw new Error("New due date must be in the future.");
        work.dueDate = newDueDate;
    }

    removeWork(work: Assignment): void {
        for (const cls of Object.values(this.classes)) {
            const index = cls.assignments.findIndex(a => a.id === work.id);
            if (index !== -1) {
                cls.assignments.splice(index, 1);
                return;
            }
        }
        throw new Error("Assignment not found.");
    }

    getAllAssignments(classid: string): Assignment[]{
        return this.classes[classid].assignments
    }

    async findAssignments(classid:string, llm: GeminiLLM): Promise<void> {
        try {
            console.log('🤖 Requesting assignments from Gemini AI...');

            const prompt = this.createAssignmentPrompt(this.syllabus);
            // console.log(`${prompt}`)
            const text = await llm.executeLLM(prompt);
            // console.log(`${text}`)
            
            console.log('✅ Received response from Gemini AI!');
            console.log('\n🤖 RAW GEMINI RESPONSE');
            console.log('======================');
            console.log(text);
            console.log('======================\n');
            
            // Parse and apply the assignments
            this.parseAndApplyAssignments(text, classid);
            
        } catch (error) {
            console.error('❌ Error calling Gemini API:', (error as Error).message);
            throw error;
        }
    }

    /**
     * Helper functions and queries follow
     */
    private ensureClassExists(classid: string): void {
        if (!this.classes[classid]) {
        throw new Error("Class does not belong to this BrontoBoard.");
        }
  }
    /**
     * Create the prompt for Gemini with hardwired preferences
     */
    private createAssignmentPrompt(syllabus: string): string {
        const criticalRequirements = [
            "1. ONLY ADD ASSIGNMENTS THAT ARE FOUND IN THE GIVEN TEXT WHICH WILL BE REFERRED TO AS THE SYLLABUS",
            "3. Return ONLY the JSON object, no additional text",
            "2. If the name of the month is found, return its corresponding number, such as 1 for January and 12 for December",
            "2. If a certain value cannot be found, return a -1 for it",
            "4. The due date of the Assignments returned HAVE to be after or on the current date",
        ];

        return `
You are a helpful AI assistant that helps find Assignments and their respective due dates for students.

With a given text, referred to as a syllabus try to find assignments and their respective due dates. They may be referred to as homework, Assignments, Problem Set
or shortened to Pset. In some cases, they may be given more elaborate names. Try to find these and return

CRITICAL REQUIREMENTS:
${criticalRequirements.join('\n')}

===== Start of Syllabus ====
${syllabus}
===== End of Syllabus ====


Return your response as a JSON object with this exact structure:
{
  "assignments": [
    {
      "name": "exact name found for the assignment",
      "monthDue": "the month the assignment is due",
      "dayDue" : "the day of the month the assignment is due",
    }
  ]
}
`;

    }

    /**
     * Parse the LLM response and apply the generated assignments
     */
    private parseAndApplyAssignments(responseText: string, classid: string): void {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const response = JSON.parse(jsonMatch[0]);
            
            if (!response.assignments || !Array.isArray(response.assignments)) {
                throw new Error('Invalid response format');
            }

            console.log('📝 Applying LLM assignments...');
            // console.log('Response was:', responseText);

            const issues: string[] = [];
            const validatedAssignments: {name: string,  dueDate: Date}[] = [];

            for (const rawAssignment of response.assignments) {
                if (typeof rawAssignment !== 'object' || rawAssignment === null) {
                    issues.push('Encountered an assignment entry that is not an object.');
                    continue;
                }

                const { name, monthDue, dayDue } = rawAssignment as {name?: unknown, monthDue?: unknown, dayDue?: unknown};

                if (typeof name !== 'string' || name.trim().length === 0) {
                    issues.push('Assignment is missing a valid name.');
                    continue;
                }

                const month = Number(monthDue);
                const day = Number(dayDue);
                if (!Number.isInteger(month) || !Number.isInteger(day)) {
                    issues.push(`Assignment "${name}" has invalid numeric fields.`);
                    continue;
                }
                const now = new Date();
                const specificDate: Date = new Date(now.getFullYear(), month - 1, day, 0, 0, 0, 0);

                if (isNaN(specificDate.getTime())) {
                    issues.push(`Assignment "${name}" produced an invalid date.`);
                    continue;
                }

                if (specificDate < now) {
                    issues.push(`Assignment "${name}" has a past due date.`);
                    continue;
                }

                validatedAssignments.push({name: name, dueDate: specificDate});
            }

            if (issues.length > 0) {
                throw new Error(`LLM provided disallowed assignments:\n- ${issues.join('\n- ')}`);
            }

            for (const assignment of validatedAssignments) {

                if (this.classes[classid].assignments.some(a => a.name === assignment.name)) {
                    throw new Error(`⚠️ Skipping duplicate assignment: ${assignment.name}`);
                }
                this.addAssignment(classid ,assignment.name, assignment.dueDate);
                console.log(`✅ Added "${assignment.name}" to ${this.classes[classid].name} (Due ${assignment.dueDate.toDateString()})`);
            }
            
        } catch (error) {
            console.error('❌ Error parsing LLM response:', (error as Error).message);
            console.log('Response was:', responseText);
            throw error;
        }
    }

    static assignmentsToString(assignments: Assignment[]): string {

        if (assignments.length === 0) return "No assignments.";

        return assignments
        .map(a => `📘 ${a.name} (Due: ${a.dueDate.toLocaleString()})`)
        .join("\n");
    }
}