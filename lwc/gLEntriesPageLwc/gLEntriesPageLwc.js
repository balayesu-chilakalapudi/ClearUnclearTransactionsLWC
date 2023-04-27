import { LightningElement,api,wire } from 'lwc';
import getGLDataAction from "@salesforce/apex/GLEntriesPageLwcController.getGLData";
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class GLEntriesPageLwc extends LightningElement {
     columns = [
        { label: 'Entry No.', fieldName: 'Name',type: 'text',sortable: true },
        { label: 'Account', fieldName: 'GFERP__GL_Account__r.Name', type: 'url',sortable: true },
        { label: 'Description', fieldName: 'GFERP__Description__c', type: 'text',sortable: true },
        { label: 'Document No.', fieldName: 'GFERP__Document_No__c', type: 'number',sortable: true },
        { label: 'Posting Date', fieldName: 'GFERP__Posting_Date__c', type: 'date',sortable: true },
        { label: 'Amount', fieldName: 'GFERP__Amount__c', type: 'currenty',sortable: true },
        { label: 'Transaction Source', fieldName: 'GFERP__Transaction_Source__c', type: 'text',sortable: true },
    ];
    data = [];
    dataObj;
    defaultSortDirection='ASC';
    sortDirection='ASC';
    sortedBy;
    glaccountId;
    displayColumn;
    startDate;

    // Used to sort the 'Age' column
    sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };

        return function (a, b) {
            a = key(a);
            b = key(b);
            return reverse * ((a > b) - (b > a));
        };
    }

    onHandleSort(event) {
        const { fieldName: sortedBy, sortDirection } = event.detail;
        const cloneData = [...this.data];

        cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
        this.data = cloneData;
        this.sortDirection = sortDirection;
        this.sortedBy = sortedBy;
    }


    

    @wire(CurrentPageReference)
    getPageReferenceParameters(currentPageReference) {
       if (currentPageReference) {
          console.log(currentPageReference);
         // this.glaccountId = currentPageReference.attributes.recordId || null;
         // let attributes = currentPageReference.attributes;
          this.glaccountId = currentPageReference.state.c__glaccountId;  
          this.displayColumn=currentPageReference.state.c__displayColumn;   
          this.startDate=currentPageReference.state.c__startDate;   
       }
    }

    connectedCallback() {
        console.log('glaccountId:' + this.glaccountId);
        if(this.glaccountId!=undefined){
            this.retrieveData();
        }
    }

    recordId_rendered = false;
    renderedCallback() {
      /*  if (!this.recordId_rendered &&
            this.recordId != undefined) {
            console.log(this.recordId + ' is provided');
            this.recordId_rendered = true;           
            this.retrieveData();
        }*/        
    }
    retrieveData() {
        getGLDataAction({ glaccountId: this.glaccountId,displayColumn: this.displayColumn,startDate:this.startDate})
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.data=this.dataObj.glEntries;                
                this.error = undefined;
                /*const evt = new ShowToastEvent({
                    title: 'Success',
                    message: 'Record Saved!',
                    variant: 'success',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);*/
            })
            .catch(error => {
                this.error = error;
                this.dataObj = undefined;
                this.data=[];
                console.log('error setting default', error);
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
            });
    }
}