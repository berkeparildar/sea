import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Re-declare interfaces (or import from a shared file)
export interface Classroom {
  name: string;
  columns: number[];
}

export interface Student {
  name: string;
  grade: string;
}

@Component({
  selector: 'app-class-view',
  templateUrl: './class-view.component.html',
  styleUrls: ['./class-view.component.css'],
  imports: [NgFor, NgIf,]
})
export class ClassViewComponent implements OnInit {
  className: string | null = null;
  seatingArrangement: (Student | null)[][] = [];
  classroom: Classroom | null = null;
  students: Student[] = [];

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Try to get the class name from the route parameters.
    this.className = this.route.snapshot.paramMap.get('className');

    // Use router.getCurrentNavigation() or fallback to history.state.
    const navState = this.router.getCurrentNavigation()?.extras.state || history.state;
    if (navState && navState.seatingArrangement) {
      this.seatingArrangement = navState.seatingArrangement;
      this.classroom = navState.classroom;
      this.students = navState.students;
    }

    // If className is not available from the URL, try to use the classroom data.
    if (!this.className && this.classroom) {
      this.className = this.classroom.name;
    }
  }

  // Helper method to generate an array of row indexes for the table
  getRowIndexes(): number[] {
    if (!this.seatingArrangement || this.seatingArrangement.length === 0) {
      return [];
    }
    const maxRows = Math.max(...this.seatingArrangement.map(col => col.length));
    return Array.from({ length: maxRows }, (_, i) => i);
  }

  getColSpan(columnsCount: number): number {
    // This ensures there is a column between each seat for odd number of columns
    return columnsCount % 2 === 0 ? 1 : 2; // Use `1` for even columns and `2` for odd to create spacing.
  }

  getClassCounts(): { className: string; count: number }[] {
    const classCounts: { [key: string]: number } = {};
  
    this.seatingArrangement.forEach((column) => {
      column.forEach((student) => {
        if (student) {
          classCounts[student.grade] = (classCounts[student.grade] || 0) + 1;
        }
      });
    });
  
    // Nesneyi diziye çevir ve { className, count } formatına getir
    return Object.keys(classCounts).map((className) => ({
      className,
      count: classCounts[className],
    }));
  }
}
