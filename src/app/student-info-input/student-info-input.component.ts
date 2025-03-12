import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SeatingService } from './seating.service';

export interface Classroom {
  name: string;         
  columns: number[];
}

export interface Student {
  name: string;  
  grade: string;
}

export interface ClassroomAssignment {
  classroom: Classroom;
  students: Student[];                   
  seatingArrangement: (Student | null)[][]; 
}

@Component({
  selector: 'app-student-info-input',
  templateUrl: './student-info-input.component.html',
  styleUrls: ['./student-info-input.component.css'],
  imports: [NgFor, NgIf, FormsModule]
})
export class StudentInfoInputComponent {
  classData: string = '';
  studentList: string = '';

  parsedClassrooms: Classroom[] = [];
  parsedStudents: Student[] = [];

  seatingArrangement: (Student | null)[][] = [];
  classroom: Classroom | null = null;
  students: Student[] = [];

  classroomAssignments: ClassroomAssignment[] = [];

  constructor(private seatingService: SeatingService, private router: Router) {}

  parseClassData(input: string): Classroom[] {
    return input.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) return null;
        const name = parts[0];
        const columns = parts.slice(1).map(Number);
        if (columns.some(isNaN)) return null;
        return { name, columns };
      })
      .filter((cls): cls is Classroom => cls !== null);
  }

  parseStudentData(input: string): Student[] {
    return input.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length !== 2) return null;
        return { name: parts[0], grade: parts[1] };
      })
      .filter((s): s is Student => s !== null);
  }

  getCapacity(classroom: Classroom): number {
    return classroom.columns.reduce((sum, colSeats) => sum + colSeats, 0);
  }

  distributeStudentsInClassroom(classroom: Classroom, students: Student[]): (Student | null)[][] {
    const numCols = classroom.columns.length;
    const seating: (Student | null)[][] = [];
    
    // Initialize the seating arrangement with null
    for (let col = 0; col < numCols; col++) {
      seating.push(new Array(classroom.columns[col]).fill(null));
    }
  
    const positions: { col: number, row: number }[] = [];
    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < classroom.columns[col]; row++) {
        positions.push({ col, row });
      }
    }
    const totalPositions = positions.length;
    const used = new Array(students.length).fill(false);
  
    // Check if placing a student here violates the adjacency rules (same grade next to each other)
    const isValid = (student: Student, col: number, row: number): boolean => {
      // Check left, right, up, down
      const adjacentPositions = [
        { col: col - 1, row }, // left
        { col: col + 1, row }, // right
        { col, row: row - 1 }, // up
        { col, row: row + 1 }  // down
      ];
  
      for (const pos of adjacentPositions) {
        if (
          pos.col >= 0 && pos.col < numCols &&
          pos.row >= 0 && pos.row < seating[pos.col].length &&
          seating[pos.col][pos.row] !== null &&
          seating[pos.col][pos.row]!.grade === student.grade
        ) {
          return false;
        }
      }
      return true;
    };
  
    function backtrack(posIndex: number, assignedCount: number): boolean {
      if (assignedCount === students.length) return true;
      if (posIndex === totalPositions) return false;
  
      const { col, row } = positions[posIndex];
      for (let i = 0; i < students.length; i++) {
        if (!used[i]) {
          const student = students[i];
          if (isValid(student, col, row)) {
            seating[col][row] = student;
            used[i] = true;
            if (backtrack(posIndex + 1, assignedCount + 1)) return true;
            seating[col][row] = null;
            used[i] = false;
          }
        }
      }
  
      // Try next position
      return backtrack(posIndex + 1, assignedCount);
    }
  
    const success = backtrack(0, 0);
    if (!success) {
      console.error(`No valid seating arrangement found for classroom ${classroom.name}`);
    }
    return seating;
  }

  processInput() {
    try {
      this.parsedClassrooms = this.parseClassData(this.classData);
      this.parsedStudents = this.parseStudentData(this.studentList);
  
      let remainingStudents = [...this.parsedStudents];
      this.classroomAssignments = [];
  
      for (let classroom of this.parsedClassrooms) {
        const capacity = this.getCapacity(classroom);
        const assignedStudents = remainingStudents.slice(0, capacity);
        remainingStudents = remainingStudents.slice(capacity);
  
        const seatingArrangement = this.distributeStudentsInClassroom(classroom, assignedStudents);
        this.classroomAssignments.push({
          classroom: classroom,
          students: assignedStudents,
          seatingArrangement: seatingArrangement
        });
      }
  
      if (remainingStudents.length > 0) {
        console.warn("Warning: Not all students were assigned to classrooms; check capacities.");
      }
  
      this.seatingService.setClassroomAssignments(this.classroomAssignments);
      console.log("Classroom Assignments:", this.classroomAssignments);
    } catch (error) {
      console.error("Error processing input:", error);
    }
  }

  // Navigate to the class view
  goToClass(className: string) {
    const assignment = this.classroomAssignments.find(a => a.classroom.name === className);
    if (assignment != undefined) {
      console.log("Navigating with state:", {
        seatingArrangement: assignment.seatingArrangement,
        classroom: assignment.classroom,
        students: assignment.students
      });
      this.router.navigate(['/class', className], {
        state: {
          seatingArrangement: assignment.seatingArrangement,
          classroom: assignment.classroom,
          students: assignment.students
        }
      });
    }
  }

  // On component init, check if data exists in service
  ngOnInit() {
    const storedAssignments = this.seatingService.getClassroomAssignments();
    if (storedAssignments.length > 0) {
      this.classroomAssignments = storedAssignments;
      this.parsedClassrooms = storedAssignments.map(a => a.classroom);  // Populate classrooms
    }
  }
}
