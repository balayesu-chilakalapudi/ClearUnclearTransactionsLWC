import {LightningElement, track, api} from 'lwc';
import getData from "@salesforce/apex/ReconciliationLwcController.fetchData";
import GFERP_GL_Entry_Button_Action from "@salesforce/apex/ReconciliationLwcController.GFERP_GL_Entry_Button_Handler";
import clear_unclear_operation_action
    from "@salesforce/apex/ReconciliationLwcController.clear_unclear_operation_handler";
import filterAction from "@salesforce/apex/ReconciliationLwcController.filterActionHandler";
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import Images from '@salesforce/resourceUrl/MyResource';

const columns = [
    {label: 'Cleared', fieldName: 'Cleared'},
    {label: 'Date', fieldName: 'Date', type: 'date'},
    {label: 'Bank Transaction Date', fieldName: 'Bank Transaction Date', type: 'Date'},
    {label: 'Amount', fieldName: 'amount', type: 'currency'},
    {label: 'Ledger Amount', fieldName: 'Ledger_Amount', type: 'currency'},
    {label: 'Source Link', fieldName: 'Source_Link', type: 'currency'},
    {label: 'Type', fieldName: 'Type', type: 'currency'},
    {label: 'Ref', fieldName: 'Ref', type: 'currency'},
    {label: 'Payee', fieldName: 'Payee', type: 'currency'},
    {label: 'Description', fieldName: 'Payee', type: 'currency'},
];
export default class Reconciliation extends LightningElement {
    @api recordId;
    @track columnsList = columns;
    @track rowOffset = [];
    @track GFERP__GL_EntryList = [];
    @track dataObj;
    recordId_rendered = false;
    show_spinner = true;

    DescriptionUpBool;
    DescriptionDWBool;
    PayeeUpBool;
    PayeeDWBool;
    RefUpBool;
    RefDWBool;
    TypeUpBool;
    TypeDWBool;
    SourceLinkUpBool;
    SourceLinkDWBool;
    LedgerAmountUpBool;
    LedgerAmountDWBool;
    AmountUpBool;
    AmountDWBool;
    BankTransactionUpBool;
    BankTransactionDWBool;
    dateUpBool;
    dateDWBool;

    connectedCallback() {
        this.show_spinner = true;
        console.log('recordId:' + this.recordId);
    }

    renderedCallback() {
        if (!this.recordId_rendered &&
            this.recordId != undefined) {
            console.log(this.recordId + ' is provided');
            this.recordId_rendered = true;
            this.retrieveData();
        }
    }
    arrowup=Images + "/MyResource/images/icons/arrowup.png";
    arrowdown=Images + "/MyResource/images/icons/arrowdown.png";
    retrieveData() {
       // this.show_spinner = true;
        getData({recordId: this.recordId})
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.GFERP__GL_EntryList = this.dataObj.glEntryList;
                let cleared_count = 0;
                let uncleared_count = 0;
                for (let x of this.GFERP__GL_EntryList) {
                    if (x.Cleared__c) {
                        cleared_count++;
                    } else {
                        uncleared_count++;
                    }
                }
                console.log('this.GFERP__GL_EntryList.length===cleared_count:' + (this.GFERP__GL_EntryList.length === cleared_count));
                if (this.GFERP__GL_EntryList.length === cleared_count) {
                    this.clear_operation_title = true;
                    this.clear_unclear_operation_title = 'Unclear All';
                } else {
                    this.clear_operation_title = false;
                    this.clear_unclear_operation_title = 'Clear All';
                }
                this.show_spinner = false;
                this.error = undefined;
            })
            .catch(error => {
                this.show_spinner = false;
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                console.log(message);
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                this.dataObj = undefined;
                console.log('error setting default', error);

            });
    }

    GFERP_GL_Entry_Button_Label = '';
    GFERP_GL_Entry_Id = '';

    handleAddClick(event) {
       // this.show_spinner = true;
        this.GFERP_GL_Entry_Id = event.target.id;
        if (this.GFERP_GL_Entry_Id.includes('-')) {
            this.GFERP_GL_Entry_Id = this.GFERP_GL_Entry_Id.split('-')[0];
        }
        this.GFERP_GL_Entry_Button_Label = 'Add';
        this.GFERP_GL_Entry_Button_Handler_Action();
    }

    handleRemoveClick(event) {
       // this.show_spinner = true;
        this.GFERP_GL_Entry_Id = event.target.id;
        if (this.GFERP_GL_Entry_Id.includes('-')) {
            this.GFERP_GL_Entry_Id = this.GFERP_GL_Entry_Id.split('-')[0];
        }
        this.GFERP_GL_Entry_Button_Label = 'Remove';
        this.GFERP_GL_Entry_Button_Handler_Action();
    }

    GFERP_GL_Entry_Button_Handler_Action() {
       // this.show_spinner = true;
        console.log('recordId:' + this.recordId);
        console.log('GFERP_GL_Entry_Id:' + this.GFERP_GL_Entry_Id);
        console.log('GFERP_GL_Entry_Button_Label:' + this.GFERP_GL_Entry_Button_Label);
        GFERP_GL_Entry_Button_Action({
            recordId: this.recordId,
            GFERP_GL_Entry_Id: this.GFERP_GL_Entry_Id,
            GFERP_GL_Entry_Button_Label: this.GFERP_GL_Entry_Button_Label
        })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.GFERP__GL_EntryList = this.dataObj.glEntryList;
                let cleared_count = 0;
                let uncleared_count = 0;
                for (let x of this.GFERP__GL_EntryList) {
                    if (x.Cleared__c) {
                        cleared_count++;
                    } else {
                        uncleared_count++;
                    }
                }
                console.log('this.GFERP__GL_EntryList.length===cleared_count:' + (this.GFERP__GL_EntryList.length === cleared_count));
                if (this.GFERP__GL_EntryList.length === cleared_count) {
                    this.clear_operation_title = true;
                    this.clear_unclear_operation_title = 'Unclear All';
                } else {
                    this.clear_operation_title = false;
                    this.clear_unclear_operation_title = 'Clear All';
                }
                this.show_spinner = false;
                eval("$A.get('e.force:refreshView').fire();");
                this.error = undefined;
            })
            .catch(error => {
                this.show_spinner = false;
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                console.log(message);
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                //  this.dataObj = undefined;
                console.log('error setting default', error);

            });
    }

    show_clear_unclear_dialog = false;
    clear_unclear_operation_title = 'Clear All';
    clear_operation_title = false;

    handleClearAll(event) {
        this.show_clear_unclear_dialog = true;
    }

    handle_clear_unclear_operation_yes(event) {
        // this.show_spinner = true;
        clear_unclear_operation_action({
            recordId: this.recordId,
            strEntryList: JSON.stringify(this.GFERP__GL_EntryList),
            clear_unclear_operation_title: this.clear_unclear_operation_title
        })
            .then(result => {
                if (this.clear_unclear_operation_title === 'Clear All') {
                    this.clear_unclear_operation_title = 'Unclear All';
                    this.clear_operation_title = true;
                } else {
                    this.clear_unclear_operation_title = 'Clear All';
                    this.clear_operation_title = false;
                }
                this.show_clear_unclear_dialog = false;
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.GFERP__GL_EntryList = this.dataObj.glEntryList;
                this.show_spinner = false;
                eval("$A.get('e.force:refreshView').fire();");
                this.error = undefined;
            })
            .catch(error => {
                this.show_clear_unclear_dialog = false;
                this.show_spinner = false;
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                console.log(message);
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                //  this.dataObj = undefined;
                console.log('error setting default', error);

            });
    }

    handle_clear_unclear_operation_no(event) {
        this.show_clear_unclear_dialog = false;
    }

    openGLAccount(event) {
        let accountid = event.target.id;
        window.open('/' + accountid, '_blank');
    }

    openGLEntry(event) {
        let glentryId = event.target.id;
        window.open('/' + glentryId, '_blank');
    }

    showFilterDialog = false;

    handleFilter(event) {
        this.filterParams = {'FromAmount': '0', 'ToAmount': '0'};
        this.showFilterDialog = true;
    }

    filter_cancel(event) {
        this.showFilterDialog = false;
    }

    @track filterParams = {'FromAmount': '0', 'ToAmount': '0'};

    SearchByLabel = '';
    showSearchByLabel = false;

    handleSearchByLabelRemove(event) {
        this.showSearchByLabel = false;
    }

    ClearByLabel = '';
    showClearByLabel = false;

    handleClearByLabelRemove(event) {
        this.showClearByLabel = false;
    }

    FromDateLabel = '';
    showFromDateLabel = false;

    handleFromDateLabelRemove(event) {
        this.showFromDateLabel = false;
    }

    ToDateLabel = '';
    showToDateLabel = false;

    handleToDateLabelRemove(event) {
        this.showToDateLabel = false;
    }

    DocumentTypeLabel = '';
    showDocumentTypeLabel = false;

    handleDocumentTypeLabelRemove(event) {
        this.showDocumentTypeLabel = false;
    }

    MinAmountLabel = '';
    showMinAmountLabel = false;

    handleMinAmountLabelRemove(event) {
        this.showMinAmountLabel = false;
    }

    MaxAmountLabel = '';
    showMaxAmountLabel = false;

    handleMaxAmountLabelRemove(event) {
        this.showMaxAmountLabel = false;
    }

    readSearchByRefDescPayee(event) {
        this.filterParams.SearchByRefDescPayee = event.target.value;
        this.SearchByLabel = 'Search By ' + this.filterParams.SearchByRefDescPayee;
        this.showSearchByLabel = true;
    }

    readCleared_Uncleared(event) {
        this.filterParams.Cleared_Uncleared = event.target.value;
        this.ClearByLabel = this.filterParams.Cleared_Uncleared;
        this.showClearByLabel = true;
    }

    readDocFromDate(event) {
        this.filterParams.DocFromDate = new Date(event.target.value);
        var today = this.filterParams.DocFromDate;
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;
        this.FromDateLabel = 'Start Date ' + today;
        this.showFromDateLabel = true;
    }

    readDocToDate(event) {
        this.filterParams.DocToDate = new Date(event.target.value);
        var today = this.filterParams.DocToDate;
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;
        this.ToDateLabel = 'End Date ' + today;
        this.showToDateLabel = true;
    }

    readAccountType(event) {
        this.filterParams.AccountType = event.target.value;
        this.DocumentTypeLabel = 'Type ' + this.filterParams.AccountType;
        this.showDocumentTypeLabel = true;
    }

    readFromAmount(event) {
        this.filterParams.FromAmount = event.target.value;
        this.MinAmountLabel = 'Min Amount ' + this.filterParams.FromAmount;
        this.showMinAmountLabel = true;
    }

    readToAmount(event) {
        this.filterParams.ToAmount = event.target.value;
        this.MaxAmountLabel = 'Max Amount ' + this.filterParams.ToAmount;
        this.showMaxAmountLabel = true;
    }

    filter_apply(event) {
        console.log('filterParams:' + JSON.stringify(this.filterParams));
        filterAction({recordId: this.recordId, filterParams: JSON.stringify(this.filterParams)})
            .then(result => {
                this.showFilterDialog = false;
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.GFERP__GL_EntryList = this.dataObj.glEntryList;
                this.show_spinner = false;
                eval("$A.get('e.force:refreshView').fire();");
                this.error = undefined;
            })
            .catch(error => {
                this.show_clear_unclear_dialog = false;
                this.show_spinner = false;
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                console.log(message);
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                //  this.dataObj = undefined;
                console.log('error setting default', error);

            });
    }

    fixedWidth = "width:15rem;";
    sortedDirection = 'asc';
    sortedColumn;

    sort(e) {
        this.DescriptionUpBool=false;
        this.DescriptionDWBool=false;
        this.PayeeUpBool=false;
        this.PayeeDWBool=false;
        this.RefUpBool=false;
        this.RefDWBool=false;
        this.TypeUpBool=false;
        this.TypeDWBool=false;
        this.SourceLinkUpBool=false;
        this.SourceLinkDWBool=false;
        this.LedgerAmountUpBool=false;
        this.LedgerAmountDWBool=false;
        this.AmountUpBool=false;
        this.AmountDWBool=false;
        this.BankTransactionUpBool=false;
        this.BankTransactionDWBool=false;
        this.dateUpBool=false;
        this.dateDWBool=false;

        this.sortedColumn = e.currentTarget.dataset.id;

        if (this.sortedColumn === e.currentTarget.dataset.id) {
            this.sortedDirection = this.sortedDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortedDirection = 'asc';
        }
        switch ( this.sortedColumn ) {

            case "GFERP__Document_Date__c":
            if ( this.sortedDirection == 'asc' )
                this.dateUpBool = true;
            else
                this.dateDWBool = true;
            
            break;

            case "GFERP__Due_Date__c":
            if ( this.sortedDirection == 'asc' )
                this.BankTransactionUpBool = true;
            else
                this.BankTransactionDWBool = true;
            
            break;

            case "GFERP__Amount__c":
                if ( this.sortedDirection == 'asc' )
                    this.AmountUpBool = true;
                else
                    this.AmountDWBool = true;
                
                break;

                case "Name":
                if ( this.sortedDirection == 'asc' )
                    this.SourceLinkUpBool = true;
                else
                    this.SourceLinkDWBool = true;
                
                break;

                case "GFERP__Document_Type__c":
                    if ( this.sortedDirection == 'asc' )
                    this.TypeUpBool = true;
                else
                    this.TypeDWBool = true;
                
                break;

                case "Customer_Payee__c":
                    if ( this.sortedDirection == 'asc' )
                    this.PayeeUpBool = true;
                else
                    this.PayeeDWBool = true;
                
                break;

                case "GFERP__Description__c":
                    if ( this.sortedDirection == 'asc' )
                    this.DescriptionUpBool = true;
                else
                    this.DescriptionDWBool = true;
                
                break;

        }
        var reverse = this.sortedDirection === 'asc' ? 1 : -1;
        let table = JSON.parse(JSON.stringify(this.GFERP__GL_EntryList));
        table.sort((a, b) => {
            return a[e.currentTarget.dataset.id] > b[e.currentTarget.dataset.id] ? 1 * reverse : -1 * reverse
        });
        
        this.GFERP__GL_EntryList = table;
        // arrows interchanging
        if(e.currentTarget.dataset.id){
            console.log('arrows interchanging started');
            try{
            let existingIcon = this.template.querySelectorAll('img[id="sorticon"]');
            let icon = document.createElement("img");
            if(existingIcon[0]){existingIcon[0].parentNode.removeChild(existingIcon[0]);}        
            let nodes = this.template.querySelectorAll('a[data-id="' + e.currentTarget.dataset.id +'"]');            
            if(this.sortedDirection === 'asc'){icon.setAttribute('src', Images + "/MyResource/images/icons/arrowup.png");}
            if(this.sortedDirection === 'desc'){icon.setAttribute('src',  Images + "/MyResource/images/icons/arrowdown.png");}
            icon.setAttribute('id', 'sorticon');
            if(nodes[0]){nodes[0].children[0].appendChild(icon);}
            }catch(err){
                console.log(err.stack);
            }
        }
    }

    handlemousedown(e) {
        if (!this._initWidths) {
            this._initWidths = [];
            let tableThs = this.template.querySelectorAll("table thead .dv-dynamic-width");
            tableThs.forEach(th => {
                this._initWidths.push(th.style.width);
            });
        }

        this._tableThColumn = e.target.parentElement;
        this._tableThInnerDiv = e.target.parentElement;
        while (this._tableThColumn.tagName !== "TH") {
            this._tableThColumn = this._tableThColumn.parentNode;
        }
        while (!this._tableThInnerDiv.className.includes("slds-cell-fixed")) {
            this._tableThInnerDiv = this._tableThInnerDiv.parentNode;
        }
        console.log("handlemousedown this._tableThColumn.tagName => ", this._tableThColumn.tagName);
        this._pageX = e.pageX;

        this._padding = this.paddingDiff(this._tableThColumn);

        this._tableThWidth = this._tableThColumn.offsetWidth - this._padding;
        console.log("handlemousedown this._tableThColumn.tagName => ", this._tableThColumn.tagName);
    }
}