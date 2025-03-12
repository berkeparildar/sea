import { Injectable } from '@angular/core';
import { Classroom, Student, ClassroomAssignment } from './student-info-input.component';  // Import relevant types

@Injectable({
  providedIn: 'root'
})
export class SeatingService {
  private classroomAssignments: ClassroomAssignment[] = [];

  setClassroomAssignments(assignments: ClassroomAssignment[]) {
    this.classroomAssignments = assignments;
  }

  getClassroomAssignments(): ClassroomAssignment[] {
    return this.classroomAssignments;
  }
}