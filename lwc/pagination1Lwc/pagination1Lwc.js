import { LightningElement, api } from 'lwc';

export default class Pagination extends LightningElement {
    currentPage = 1;
    totalRecords;
    @api recordSize = 5;
    totalPage = 0;
    start = 0;
    end = 0;
    totalRecordSize = 0;
    displayRecordSize=0;
    get records() {
        return this.visibleRecords;
    }
    @api
    set records(data) {
        console.log('data:' + data);
        if (data) {
            this.totalRecords = data;
            this.recordSize = Number(this.recordSize);
            this.totalPage = Math.ceil(data.length / this.recordSize);
            this.start = (this.currentPage - 1) * this.recordSize;
            this.end = this.recordSize * this.currentPage;
            this.totalRecordSize = data.length;
            if(this.recordSize<data.length){
                this.displayRecordSize=data.length;
            }else{
                this.displayRecordSize=this.recordSize;
            }
            this.updateRecords();
        }
    }
    get disableFirst() {
        return this.currentPage == 1;
    }
    get disablePrevious() {
        return this.currentPage <= 1;
    }
    get disableNext() {
        return this.currentPage >= this.totalPage;
    }
    get disableLast() {
        return this.currentPage == this.totalPage;
    }
    firstHandler() {
        if (this.currentPage > 1) {
            this.currentPage = 1;
            this.updateRecords();
        }
    }
    previousHandler() {
        if (this.currentPage > 1) {
            this.currentPage = this.currentPage - 1;
            this.updateRecords();
        }
    }
    nextHandler() {
        if (this.currentPage < this.totalPage) {
            this.currentPage = this.currentPage + 1;
            this.updateRecords();
        }
    }
    lastHandler() {
        if (this.currentPage <= this.totalPage) {
            this.currentPage = this.totalPage;
            this.updateRecords();
        }
    }

    updateRecords() {
        this.start = (this.currentPage - 1) * this.recordSize;
        this.end = this.recordSize * this.currentPage;
        this.visibleRecords = this.totalRecords.slice(this.start, this.end);
        if (this.end > this.totalRecordSize) {
            this.end = this.totalRecordSize;
        }
        this.displayRecordSize=this.end-this.start;
        this.dispatchEvent(new CustomEvent('update', {
            detail: {
                records: this.visibleRecords
            }
        }))
    }
}