import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { JhiAlertService } from 'ng-jhipster';
import { ITeamSkill } from 'app/shared/model/team-skill.model';
import { TeamService } from 'app/entities/team';
import { ITeam } from 'app/shared/model/team.model';
import { TeamsSkillsService } from 'app/teams/teams-skills.service';
import { ILevel } from 'app/shared/model/level.model';
import { IBadge } from 'app/shared/model/badge.model';
import { IDimension } from 'app/shared/model/dimension.model';
import { IBadgeSkill } from 'app/shared/model/badge-skill.model';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { LevelSkillService } from 'app/entities/level-skill';
import { ILevelSkill } from 'app/shared/model/level-skill.model';
import { Location } from '@angular/common';
import { ISkill } from 'app/shared/model/skill.model';
import { SkillService } from 'app/entities/skill';
import { BreadcrumbService } from 'app/layouts/navbar/breadcrumb.service';
import { DimensionService } from 'app/entities/dimension';
import { Progress } from 'app/shared/achievement/model/progress.model';
import 'simplebar';
@Component({
    selector: 'jhi-overview-skills',
    templateUrl: './overview-skills.component.html',
    styleUrls: ['./overview-skills.scss']
})
export class OverviewSkillsComponent implements OnInit, OnChanges {
    @Input() teams: ITeam[];
    @Input() levels: ILevel[];
    @Input() badges: IBadge[];
    @Input() activeSkill: ISkill;
    @Output() onSkillClicked = new EventEmitter<{ iSkill: ISkill }>();
    activeSkills: ILevelSkill[] | IBadgeSkill[];
    activeLevel: ILevel;
    activeBadge: IBadge;
    dimensions: IDimension[];
    dimensionsBySkillId: any;
    generalSkillsIds: number[];

    constructor(
        private levelSkillService: LevelSkillService,
        private skillService: SkillService,
        private jhiAlertService: JhiAlertService,
        private teamService: TeamService,
        private teamsSkillService: TeamsSkillsService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        private breadcrumbService: BreadcrumbService,
        private dimensionService: DimensionService
    ) {}

    ngOnInit() {
        this.route.queryParamMap.subscribe((params: ParamMap) => {
            if (params.get('level')) {
                this.activeLevel = this.levels.find((level: ILevel) => level.id === Number.parseInt(params.get('level')));
                this.activeSkills = this.activeLevel ? this.activeLevel.skills : [];
                this.activeBadge = null;
                this.updateBreadcrumb(null, this.activeLevel, this.activeBadge, this.activeSkill);
            } else if (params.get('badge')) {
                this.activeBadge = this.badges.find((badge: IBadge) => badge.id === Number.parseInt(params.get('badge')));
                this.activeSkills = this.activeBadge ? this.activeBadge.skills : [];
                this.activeLevel = null;
                this.updateBreadcrumb(null, this.activeLevel, this.activeBadge, this.activeSkill);
            } else {
                this.levelSkillService.query().subscribe(
                    (res: HttpResponse<ILevelSkill[]>) => {
                        this.activeSkills = res.body;
                        this.updateBreadcrumb(null, this.activeLevel, this.activeBadge, this.activeSkill);
                    },
                    (res: HttpErrorResponse) => this.onError(res.error)
                );
            }
        });

        this.generalSkillsIds = [];
        this.dimensionsBySkillId = {};
        this.levels.forEach(level => {
            level.skills.forEach((levelSkill: ILevelSkill) => {
                const skillId = levelSkill.skillId;
                this.dimensionsBySkillId[skillId] = this.dimensionsBySkillId[skillId] || [];
                if (this.dimensionsBySkillId[skillId].indexOf(level.dimensionId) === -1) {
                    this.dimensionsBySkillId[skillId].push(level.dimensionId);
                }
            });
        });

        this.badges.forEach(badge => {
            if (badge.dimensions.length === 0) {
                this.generalSkillsIds = this.generalSkillsIds.concat(badge.skills.map(bs => bs.skillId));
            }

            badge.dimensions.forEach(dimension => {
                badge.skills.forEach((badgeSkill: IBadgeSkill) => {
                    const skillId = badgeSkill.skillId;
                    this.dimensionsBySkillId[skillId] = this.dimensionsBySkillId[skillId] || [];

                    this.dimensionsBySkillId[skillId].forEach(entry => {
                        if (entry.indexOf(skillId) === -1) {
                            this.dimensionsBySkillId[skillId].push(dimension.id);
                        }
                    });
                });
            });
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateBreadcrumb(null, this.activeLevel, this.activeBadge, this.activeSkill);
    }

    private updateBreadcrumb(team: ITeam, level: ILevel, badge: IBadge, skill: ISkill) {
        if (level !== null && typeof level !== 'undefined') {
            this.dimensionService.find(this.activeLevel.dimensionId).subscribe(dimension => {
                this.breadcrumbService.setBreadcrumb(team, dimension.body, level, badge, skill);
            });
        } else {
            this.breadcrumbService.setBreadcrumb(team, null, level, badge, skill);
        }
    }

    private onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }

    getRelevantTeams(itemSkill: ILevelSkill | IBadgeSkill): string {
        const countProgress = new Progress(0, 0);
        for (const team of this.teams) {
            const teamSkill = this.findTeamSkill(team, itemSkill);
            if (this.isRelevantSkill(team, teamSkill, itemSkill)) {
                countProgress.required++;
                if (this.isTeamSkillCompleted(teamSkill)) {
                    countProgress.achieved++;
                }
            }
        }
        if (this.generalSkillsIds.indexOf(itemSkill.id) !== -1) {
            countProgress.required = this.teams.length;
        }
        return `${countProgress.achieved}  / ${countProgress.required}`;
    }

    private isRelevantSkill(team: ITeam, teamSkill: ITeamSkill, itemSkill: ILevelSkill | IBadgeSkill) {
        if (teamSkill && teamSkill.irrelevant) {
            return false;
        }
        const skillDimensionIds = this.dimensionsBySkillId[itemSkill.skillId] || [];
        return team.participations.some(dimension => {
            return skillDimensionIds.indexOf(dimension.id) !== -1;
        });
    }

    private findTeamSkill(team: ITeam, skill: ILevelSkill | IBadgeSkill): ITeamSkill {
        return team.skills ? team.skills.find((teamSkill: ITeamSkill) => teamSkill.skillId === skill.skillId) : null;
    }

    private isTeamSkillCompleted(teamSkill: ITeamSkill): boolean {
        return teamSkill && !!teamSkill.completedAt;
    }

    skillClicked(event, skill: ILevelSkill) {
        const url = this.router.createUrlTree(['/overview', 'skills', skill.skillId]).toString();
        this.location.replaceState(url);
        event.preventDefault();
    }

    isActiveSkill(iLevelSkill: ILevelSkill) {
        return typeof this.activeSkill !== 'undefined' && this.activeSkill !== null && this.activeSkill.id === iLevelSkill.skillId;
    }
}
