import { LightningElement, api, track } from 'lwc';
import { CloseActionScreenEvent } from "lightning/actions";
import { loadStyle } from "lightning/platformResourceLoader";
import modal from "@salesforce/resourceUrl/custommodal";
import getData from "@salesforce/apex/ClearUnclearTransactionsLWCController.fetchDataWrapper";
import saveCleared from "@salesforce/apex/ClearUnclearTransactionsLWCController.saveClearedBoxes";
import saveUncleared from "@salesforce/apex/ClearUnclearTransactionsLWCController.saveUnclearedBoxes";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class ClearUnclearTransactionsLWC extends LightningElement {
    @api recordId;
    @track clearedTransactions;
    @track unclearedTransactions;
    @track clearedTransactions_Original;
    @track unclearedTransactions_Original;
    @track dataObj;
    @track dataObjOriginal;
    recordId_rendered = false;

    connectedCallback() {
        loadStyle(this, modal);
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

    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    retrieveData() {
        getData({ recordId: this.recordId })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.dataObj = result;
                this.dataObjOriginal = result;
                this.clearedTransactions_Original = this.dataObj.clearedTransactions;
                this.unclearedTransactions_Original = this.dataObj.unclearedTransactions;
                //console.log('unclearedTransactions:' + JSON.stringify(this.unclearedTransactions));
                this.error = undefined;
            })
            .catch(error => {
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

    updateClearedTransactions(event) {
        console.log('updateClearedTransactions: > ');
        this.clearedTransactions = [...event.detail.records];
        //console.log(event.detail.records);
    }

    updateUnclearedTransactions(event) {
        console.log('updateUnclearedTransactions: > ');
        this.unclearedTransactions = [...event.detail.records];
       // console.log('this.unclearedTransactions:' + JSON.stringify(this.unclearedTransactions));
        // console.log(event.detail.records);
    }
    endDateToSearch;
    readEndDate(event) {
        this.endDateToSearch = event.target.value;
    }
    searchParam;
    readSearchParam(event) {
        this.searchParam = event.target.value;
        this.doSearch(event);
    }
    doSearch(event) {
        try {
            let searchparam = event.target.value;
            let endDateToSearch = this.endDateToSearch;
            console.log('searchdate:' + endDateToSearch);
            console.log('searchparam:' + searchparam);
            let data = this.unclearedTransactions_Original;
            let results = [];
            for (let x of data) {
                if ((x.GFERP__Account__r.Name).includes(searchparam)) {
                    results.push(x);
                }
            }
           // this.unclearedTransactions = results;
            this.dataObj.unclearedTransactions = results;
            if (searchparam.length === 0) {
                //show first 5 records
                this.dataObj.unclearedTransactions = data;
                //data.slice(1, 5);
            }
        } catch (err) {
            console.log(err.stack);
        }
    }
    unclearedIds = [];
    handleSelectAllUncleared(event) {
        try {

            let i;
            let checkboxes = this.template.querySelectorAll('[data-id="uncleared"]')
            for (i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = event.target.checked;
            }
            this.unclearedIds = [];
            for (let x of this.unclearedTransactions) {
                if (event.target.checked) {
                    this.unclearedIds.push(x.Id);
                }
            }
            console.log('unclearedIds:' + JSON.stringify(this.unclearedIds));
        } catch (err) {
            console.log(err.stack);
        }
    }

    handleUnclearedBox(event) {
        try {
            let boxId = event.target.value;
            console.log('boxId:' + boxId);
            if (event.target.checked) {
                this.unclearedIds.push(boxId);
            } else {
                //remove item from array
                const index = this.unclearedIds.indexOf(boxId);
                if (index > -1) { // only splice array when item is found
                    this.unclearedIds.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
            console.log('unclearedIds:' + JSON.stringify(this.unclearedIds));
        } catch (err) {
            console.log(err.stack);
        }
    }

    dosaveUnclearBoxesSelected(event){
        saveUncleared({ boxIdStr: this.unclearedIds.toString() })
        .then(result => {
            //console.log('result:' + JSON.stringify(result));
            this.error = undefined;
            this.unclearedIds=[];
            
            const evt = new ShowToastEvent({
                title: 'SUCCESS',
                message: 'Saved Successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            this.retrieveData();
        })
        .catch(error => {
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
            console.log('error setting default', error);
        });
    }

    clearedIds = [];

    handleSelectAllCleared(event) {
        try {

            let i;
            let checkboxes = this.template.querySelectorAll('[data-id="cleared"]')
            for (i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = event.target.checked;
            }
            this.clearedIds = [];
            for (let x of this.clearedTransactions) {
                if (event.target.checked) {
                    this.clearedIds.push(x.Id);
                }
            }
            console.log('clearedIds:' + JSON.stringify(this.clearedIds));
        } catch (err) {
            console.log(err.stack);
        }
    }

    handleClearedBox(event) {
        try {
            let boxId = event.target.value;
            console.log('boxId:' + boxId);
            if (event.target.checked) {
                this.clearedIds.push(boxId);
            } else {
                //remove item from array
                const index = this.clearedIds.indexOf(boxId);
                if (index > -1) { // only splice array when item is found
                    this.clearedIds.splice(index, 1); // 2nd parameter means remove one item only
                }
            }
            console.log('clearedIds:' + JSON.stringify(this.clearedIds));
        } catch (err) {
            console.log(err.stack);
        }
    }

    dosaveClearBoxesSelected(event){
        saveCleared({ boxIdStr: this.clearedIds.toString() })
        .then(result => {
            //console.log('result:' + JSON.stringify(result));
            this.error = undefined;
            this.clearedIds=[];
            
            const evt = new ShowToastEvent({
                title: 'SUCCESS',
                message: 'Saved Successfully',
                variant: 'success',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
            this.retrieveData();
        })
        .catch(error => {
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
            console.log('error setting default', error);
        });
    }

    doEndDateSearch(event){
        try{
            let enddate=this.endDateToSearch;
            if(enddate==null){
                const evt = new ShowToastEvent({
                    title: 'Missing End Date',
                    message: 'End Date: You must enter a value',
                    variant: 'warning',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);  
              //  this.dataObj.unclearedTransactions = this.unclearedTransactions_Original;              
            }else{
                let data = this.unclearedTransactions_Original;
                let results = [];
                for (let x of data) {
                    if ((x.GFERP__Document_Date__c).includes(enddate)) {
                        results.push(x);
                    }
                }
            // this.unclearedTransactions = results;
                this.dataObj.unclearedTransactions = results;            
            }
        }catch(err){
            console.log(err.stack);
        }
    }
    
    sortedDirection = 'asc';
    sortedColumn;
    sort(e) {
        if(this.sortedColumn === e.currentTarget.dataset.id){
            this.sortedDirection = this.sortedDirection === 'asc' ? 'desc' : 'asc';
        }else{
            this.sortedDirection = 'asc';
        }        
        var reverse = this.sortedDirection === 'asc' ? 1 : -1;
        let table = JSON.parse(JSON.stringify(this.dataObj.unclearedTransactions));
        table.sort((a,b) => {return a[e.currentTarget.dataset.id] > b[e.currentTarget.dataset.id] ? 1 * reverse : -1 * reverse});
        this.sortedColumn = e.currentTarget.dataset.id;        
        this.dataObj.unclearedTransactions = table;
        if(e.currentTarget.dataset.id){

            let existingIcon = this.template.querySelectorAll('img[id="sorticon"]');
            if(existingIcon[0]){existingIcon[0].parentNode.removeChild(existingIcon[0]);}
        
            let nodes = this.template.querySelectorAll('a[data-id="' + e.currentTarget.dataset.id +'"]')
            if(this.sortedDirection === 'asc'){icon.setAttribute('src', Images + "/images/icons/arrowup.png");}
            if(this.sortedDirection === 'desc'){icon.setAttribute('src',  Images + "/images/icons/arrowdown.png");}
            icon.setAttribute('id', 'sorticon');
            if(nodes[0]){nodes[0].children[0].appendChild(icon);}
        }
    }  

    sortedDirectionCleared = 'asc';
    sortedColumnCleared;
    sortCleared(e) {
        if(this.sortedColumnCleared === e.currentTarget.dataset.id){
            this.sortedDirectionCleared = this.sortedDirectionCleared === 'asc' ? 'desc' : 'asc';
        }else{
            this.sortedDirectionCleared = 'asc';
        }        
        var reverse = this.sortedDirectionCleared === 'asc' ? 1 : -1;
        let table = JSON.parse(JSON.stringify(this.dataObj.clearedTransactions));
        table.sort((a,b) => {return a[e.currentTarget.dataset.id] > b[e.currentTarget.dataset.id] ? 1 * reverse : -1 * reverse});
        this.sortedColumnCleared = e.currentTarget.dataset.id;        
        this.dataObj.clearedTransactions = table;
        if(e.currentTarget.dataset.id){

            let existingIcon = this.template.querySelectorAll('img[id="sorticon"]');
            if(existingIcon[0]){existingIcon[0].parentNode.removeChild(existingIcon[0]);}
        
            let nodes = this.template.querySelectorAll('a[data-id="' + e.currentTarget.dataset.id +'"]')
            if(this.sortedDirection === 'asc'){icon.setAttribute('src', Images + "/images/icons/arrowup.png");}
            if(this.sortedDirection === 'desc'){icon.setAttribute('src',  Images + "/images/icons/arrowdown.png");}
            icon.setAttribute('id', 'sorticon');
            if(nodes[0]){nodes[0].children[0].appendChild(icon);}
        }
    }  
}