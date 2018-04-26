import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TeamdojoSharedModule } from 'app/shared';
import { TEAMS_ROUTE, TeamsComponent } from './';
import { TeamsStatusComponent } from './teams-status.component';
import { TeamsAchievementsComponent } from './teams-achievements.component';
import { TeamsSkillsComponent } from './teams-skills.component';
import { TeamsResolve } from './teams.route';
import { TeamsService } from './teams.service';
import { TeamsSkillsService } from './teams-skills.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [TeamdojoSharedModule, RouterModule.forChild([TEAMS_ROUTE]), NgbModule],
    declarations: [TeamsComponent, TeamsStatusComponent, TeamsAchievementsComponent, TeamsSkillsComponent],
    entryComponents: [],
    providers: [TeamsService, TeamsSkillsService, TeamsResolve],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TeamsModule {}