import { Routes } from '@angular/router';
import { StudentInfoInputComponent } from './student-info-input/student-info-input.component';
import { ClassViewComponent } from './class-view/class-view.component';

export const routes: Routes = [
    { path: '', component: StudentInfoInputComponent },
    { path: 'class/:className', component: ClassViewComponent } // Parameterized route
];
