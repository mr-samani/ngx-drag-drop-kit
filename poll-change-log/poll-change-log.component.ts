import { UtcDateTimeHelper } from '@_core/helper/utc-datetime.helper';
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    ChangeLogServiceProxy,
    GetPollChangeLogsDto,
    LocalizedChangeLogDto,
} from '@shared/service-proxies/service-proxies';
import { DateTime } from 'luxon';
import { Paginator } from 'primeng/paginator';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { finalize } from 'rxjs';
import { Clipboard } from '@angular/cdk/clipboard';
@Component({
    selector: 'app-poll-change-log',
    templateUrl: './poll-change-log.component.html',
    styleUrls: ['./poll-change-log.component.scss'],
    standalone: false,
    animations: [appModuleAnimation()],
})
export class PollChangeLogComponent extends AppComponentBase implements OnInit {
    pollId: number;
    propertyName = '';
    description = '';
    originalValue = '';
    newValue = '';
    reason = '';

    endDate?: DateTime;
    startDate?: DateTime;

    advancedFiltersAreShown = false;
    @ViewChild('dataTable', { static: true }) dataTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;
    constructor(
        injector: Injector,
        private changeLogService: ChangeLogServiceProxy,
        private clipboard: Clipboard,
    ) {
        super(injector);
        this.pollId = this.route.snapshot.params['pollId'];
    }

    ngOnInit() {}
    getList(event?: TableLazyLoadEvent) {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            if (this.primengTableHelper.records && this.primengTableHelper.records.length > 0) {
                return;
            }
        }
        this.showMainSpinner();
        this.primengTableHelper.showLoadingIndicator();
        const input = new GetPollChangeLogsDto();
        input.pollId = this.pollId;
        input.propertyName = this.propertyName;
        input.description = this.description;
        input.originalValue = this.originalValue;
        input.newValue = this.newValue;
        input.reason = this.reason;
        input.startDate = this.startDate
            ? UtcDateTimeHelper.convertLocalDateTimeToUTC(this.startDate, '23:59')
            : ('' as any);
        input.endDate = this.endDate ? UtcDateTimeHelper.convertLocalDateTimeToUTC(this.endDate, '00:00') : ('' as any);

        input.skipCount = this.primengTableHelper.getSkipCount(this.paginator, event);
        input.sorting = this.primengTableHelper.getSorting(this.dataTable);
        input.maxResultCount = this.primengTableHelper.getMaxResultCount(this.paginator, event);
        this.changeLogService
            .getPollChangeLogs(input)
            .pipe(
                finalize(() => {
                    this.hideMainSpinner();
                    this.primengTableHelper.hideLoadingIndicator();
                }),
            )
            .subscribe((result) => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items ?? [];
            });
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
        // TODO: zero primeng table has bug on reload empty table

        if (this.primengTableHelper.records.length === 0) this.getList();
    }

    back(): void {
        window.history.back();
    }

    copy(record: LocalizedChangeLogDto) {
        console.log(record);
        this.clipboard.copy(JSON.stringify(record));
        this.notify.success(this.l('CopiedToClipboard'));
    }
}
