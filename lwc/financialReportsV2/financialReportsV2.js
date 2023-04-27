import { LightningElement,track,wire,api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import financialReportsV2 from './financialReportsV2.html';
import profitLossReport from './profitLossReport.html';
import Test from './Test.html';
import {NavigationMixin} from 'lightning/navigation';
import getFinancialReportingList from '@salesforce/apex/RunFinancialReportsV2.getFinancialReportingList';
import deleteMultipleFinancialReportingRecord from "@salesforce/apex/RunFinancialReportsV2.deleteMultipleFinancialReportingRecord";
import getFinancialReportResultRecord from "@salesforce/apexContinuation/RunFinancialReportsV2.getFinancialReportResultRecord";
import fetchReportTypes from '@salesforce/apex/RunFinancialReportsV2.fetchReportTypes';
import getFinancialRepData from "@salesforce/apex/RunFinancialReportsV2.getFinancialRepData";
import getGlSummary from '@salesforce/apex/FinancialReportResultController.getGlSummary';
import fetchGLAccount from '@salesforce/apex/RunFinancialReportsV2.fetchGLAccount';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';


const columns = [
    {
        label: 'Report Number',
        fieldName: 'reportName',
        type: 'url',
        typeAttributes: { label: { fieldName: 'name' }, target: '_blank' }
    },
    {
        label: 'Ledger',
        fieldName: 'legderId',
        type: 'url',
        typeAttributes: { label: { fieldName: 'ledger' }, target: '_blank' }
    },
    {
        label: 'Start Period',
        fieldName: 'startPeriod',
        type: 'url',
        typeAttributes: { label: { fieldName: 'sp' }, target: '_blank' }
    },
    {
        label: 'End Period',
        fieldName: 'endPeriod',
        type: 'url',
        typeAttributes: { label: { fieldName: 'ep' }, target: '_blank' }
    },
    { label: 'GL Variable 1', fieldName: 'glVar1' },
    { label: 'GL Variable 2', fieldName: 'glVar2' },
    { label: 'GL Variable 3', fieldName: 'glVar3' },
    { label: 'GL Variable 4', fieldName: 'glVar1' },
    { label: 'Status', fieldName: 'status' },
    { label: 'Completed Date/Time', fieldName: 'completedDateTime' },
    { label: 'Created By', fieldName: 'createdBy', type: 'date' },
];
export default class FinancialReportsV2 extends NavigationMixin(LightningElement) {
    showTemplateOne = true;
    selectedReportTypeId;

//kartik
showReport = false;

///end

   render() {
      // return this.showTemplateOne ? financialReportsV2 : profitLossReport;
       return this.showTemplateOne ? financialReportsV2 : Test;
   }



   handleTabChange() {
       this.showTemplateOne = !this.showTemplateOne;
        let type = this.financialRepType.filter(rep => rep.reportTypeName == 'Profit & Loss');
        this.selectedReportTypeId = type[0].reportTypeId;
   }

   onchange(event) {
       var name = event.currentTarget.dataset.name;
       this.template.querySelector('input[data-id="' + name + '"]').checked = event.target.checked;
   }

   allSelected(event) {
       const selectedRows = this.template.querySelectorAll('lightning-input');
       for (let i = 0; i < selectedRows.length; i++) {
           if (selectedRows[i].type === 'checkbox') {
               selectedRows[i].checked = event.target.checked;
           }
       }
   }

   get reportPeriodOption() {
       return [
           { label: 'This Year-to-Date', value: 'This Year-to-Date' },
           { label: 'Last 12 Months', value: 'Last 12 Months' },
       ];
   }
   get displayColumnOptionPL() {
       let type = this.financialRepType.filter(rep => rep.reportTypeName == 'Profit & Loss');
      // console.log('type '+JSON.stringify(type));
       let options = [];
       for(let valuePL in type[0].displayColumnOptions){
           options.push({ label: type[0].displayColumnOptions[valuePL], value: type[0].displayColumnOptions[valuePL] })
       }
      // console.log('options '+JSON.stringify(options));
       return options;
       // return [
       //     { label: 'Totals Only', value: 'Totals Only' },
       //     { label: 'Months', value: 'Months' },
       // ];
   }


   StandardReportRows = [];
   columns = columns;
   refreshTable
   showTabs = false;
   isLoading = false;
   insertedRecordId = null;
   showSpinner = false;
   isShowToast = false;
   isGlAccShow = true;
   roundingTextValue = '';
   currencyValue = 'USD';
   filter = {
       'reportPeriod' : 'This Year-to-Date',
       'displayColumn' : 'Totals Only'
   };
   @track value;
   @track includeSubType1CheckBoxValue = false;
   @track includeSubType2CheckBoxValue = false;
   @track suppressZeroAmountRowsCheckBoxValue = false;
   @track startAccountingPeriodId;
   @track endAccountingPeriodId;
   @track endDate;
   @track allCheck = false;
   @track isModalOpen = false;
   @track cardTitle = '';
   @track items = [
       {
           id: 'menu-item-1',
           label: 'Profit & Loss',
           value: 'Profit & Loss',
       }
   ];

   glRecord;
   @track glAccountId;
   @track glKeyValue;
   @track glKeyValueCounter = 1;
   @track financialRepType = [];
   @track recordId;
   @track columnData =[];
   @track reportData;

   connectedCallback() {
       this.recordId = 'a364x0000003IVkAAM';
       this.showSpinner = true;
       fetchReportTypes({}).then(res =>{
         //  console.log('res ',res);
           this.financialRepType = res;
       });
       //console.log('this.financialRepType ',JSON.stringify(this.financialRepType));
       getGlSummary({}).then((res) => {
           this.glRecord = res;
           this.startAccountingPeriodId = res.GFERP__Accounting_Period__c;
           this.endAccountingPeriodId = res.GFERP__Accounting_Period__c;
           this.glAccountId = res.GFERP__GL_Account__c;
           this.glKeyValue =  Date.now().toString();
           //console.log('this.glRecord', this.glRecord);
       });
       getFinancialReportingList({}).then((res) => {
           this.showTabs = true;
           this.showSpinner = false;
           //console.log('res: ', res);
           if (res != null) {
               this.StandardReportRows = res;
               this.StandardReportRows = [...this.StandardReportRows];
               this.refreshTable = this.StandardReportRows;
           }
          // console.log('this.StandardReportRows: ', this.StandardReportRows);
           // this.generateRows();
       });
   }
   handlePeriodChange(event){
       this.filter[event.target.name] = event.detail.value;
   }
   handleDiplayColmunByChange(event){
       this.filter[event.target.name] = event.detail.value;
   }
   handleRunReport(){
      // this.showSpinner = true;
       this.toastTitle = 'Financial Reports';
       this.toastMessage = 'Report generation is in progress.';
       this.toastVariant = 'success';
       this.isShowToast = true;
       setTimeout(() => {
           this.isShowToast = false;
       }, 1000);
       // var fields = {'GFERP__GL_Account__c' : this.glAccountId, 'GFERP__Key__c' : this.glKeyValue, 'GFERP__GL_Ledger__c' : 'a0a4x000001PYDLAA4'}; //Need to get clarify on the GFERP__GL_Ledger__c field 
       // var objRecordInput = {'apiName' : 'GFERP__GL_Summary__c', fields};
       // createRecord(objRecordInput).then(response => {
       //     this.runReport(response.id);
       // }).catch(error => {
       //     console.error('Error: ::::' ,error);
       //     this.showSpinner = false;
       // });
       //  this.runReport(response.id);
       this.runReport();
      this.runReportNew();
   }
   getArrayData(){
       return Array.from(this.reportData);
   }
   getSubMapEntries(subMap) {
       return Object.entries(subMap);
   }
   runReport() {
       // try {
           this.columnData = [];
           var tempObj = {};
           // this.showSpinner = false;
           this.glKeyValueCounter++;
           this.glKeyValue =  Date.now().toString();
           // this.insertedRecordId = summeryId;
           // tempObj.glInsertedRecordId = this.insertedRecordId;
           tempObj.currencyValue = this.currencyValue;
           tempObj.includeSubType1CheckBoxValue = Boolean(this.includeSubType1CheckBoxValue);
           tempObj.includeSubType2CheckBoxValue = this.includeSubType2CheckBoxValue;
           tempObj.suppressZeroAmountRowsCheckBoxValue = this.suppressZeroAmountRowsCheckBoxValue;
           tempObj.roundingTextValue = this.roundingTextValue;
           tempObj.reportRounding = this.value;
           tempObj.startAccountingPeriodId = this.startAccountingPeriodId;
           tempObj.endAccountingPeriodId = this.endAccountingPeriodId;

           tempObj.reportPeriod = this.filter.reportPeriod;
           tempObj.displayColumn = this.filter.displayColumn;
           tempObj.reportTypeId = this.selectedReportTypeId;
             
           getFinancialRepData({newItems: tempObj}).then((res) => {

               if (res != null) {
                   //console.log('this.filter.displayColumn>>>',this.filter.displayColumn);
                  
                   if(this.filter.displayColumn == 'Totals Only'){
                      res.colWrapperSet.forEach(item=>{
                       if(item == 'Total'){
                         //  this.columnData.push(item);
                       }
                      })
                   }
                   else{
                      // this.columnData = res.colWrapperSet;
                   }
                   // this.reportData = res.typeWrapperList;
                   // this.reportData.forEach(function(item) {
                   //     item.forEach(function(itemInner){
                   //         itemInner.sort(function(a,b){

                   //         })
                   //     })
                   // });
                   this.showReport = true;
               // res.typeWrapperList.forEach(obj => {
               //     obj.subTypeWrapperList.forEach(financialData => {
               //         financialData.financialDataList.sort((a, b) => (a, b) => a.sortingNumber - b.sortingNumber); // sort items array by name
               //     });
               // });

               res.typeWrapperList.forEach(function(item) {
                   //console.log(item);
                   item.subTypeWrapperList.forEach(function(subType) {
                       subType.financialDataList.sort(function(a, b) {
                           return a.sortingNumber - b.sortingNumber;
                       });
                   });
                   // item.subTypeWrapperList.sort(function(a, b) {
                   //         return a.sortingNumber - b.sortingNumber;
                   // });
               });
               res.typeWrapperList.forEach(function(item) {
                   //console.log(item);
                    item.subTypeWrapperList.sort(function(a, b) {
                           return a.sortingNumber - b.sortingNumber;
                   });
               });
               }
               this.reportData = res.typeWrapperList;
               //console.log('res: ', JSON.stringify(this.reportData));

               res.typeWrapperList.forEach(item=>{
                   //console.log(item);
                   item.subTypeWrapperList.forEach(items=>{
                      // console.log(items);
                   })
               })
           });

          
           // getFinancialReportResultRecord({newItems: tempObj}).then(() => {
           //     getFinancialReportingList({}).then((res) => {
           //         if (res != null) {
           //             console.log('res: ', res);
           //             this.StandardReportRows = res;
           //             this.StandardReportRows = [...this.StandardReportRows];
           //             // this.generateRows();
           //             // const toast = new ShowToastEvent({
           //             //     title: 'Financial Reports',
           //             //     message: 'Report generation is completed.',
           //             //     variant: 'success',
           //             //     mode: 'sticky'
           //             // });
           //             this.showSpinner = false;
           //             // this.isModalOpen = false;
           //             this.toastTitle = 'Financial Reports';
           //             this.toastMessage = 'Report generation is completed.';
           //             this.toastVariant = 'success';
           //             this.isShowToast = true;
           //             setTimeout(() => {
           //                 this.isShowToast = false;
           //             }, 1000);
           //         }
           //     }).catch(error => {
           //         console.log('getFinancialReportingList Error : ',error);
           //         this.showSpinner = false;
           //     })
           // }).catch(error => {
           //     console.log('getFinancialReportResultRecord Error : ',error);
           //     this.showSpinner = false;
           // })
           // setTimeout(() => {
           //     this.isShowToast = false;
           //     this.showTabs = false;
           //     this.insertedRecordId = null;
           //     this.generateRows();
           //     this.showTabs = true;
           //     this.toastTitle = 'Financial Reports';
           //     this.toastMessage = 'Report generation is completed.';
           //     this.toastVariant = 'success';
           //     this.isShowToast = true;
           //     setTimeout(() => {
           //         this.isShowToast = false;
           //     }, 1000);
           // }, 6000);
       //  } 
       // catch (error) {
       //     this.showSpinner = false;
       //     console.log('Error: ', error);
       // }
   }
   displayChild(event){
       let index = event.currentTarget.dataset.index;
       //console.log('data',event.currentTarget.dataset.index);
        this.reportData[index].showData = !this.reportData[index].showData;
       //console.log('data',event.currentTarget.dataset.type);
   }

   generateRows() {
       this.StandardReportRows && this.StandardReportRows.forEach((element) => {
           if (element.glSummaryId == this.insertedRecordId) {
               element.isImage = true;
           } else {
               element.isImage = false;
           }
       });
       this.StandardReportRows = [...this.StandardReportRows];
       //console.log('this.StandardReportRows: ', this.StandardReportRows);
   }


   handleSubmitError(event) {
       this.showSpinner = false;
      // console.log(JSON.parse(JSON.stringify(event.detail)))
   }

   handleOnSubmit(event) {
       this.showSpinner = true;
       this.toastTitle = 'Financial Reports';
       this.toastMessage = 'Report generation is in progress.';
       this.toastVariant = 'success';
       this.isShowToast = true;
       event.preventDefault();       // stop the form from submitting
       const fields = event.detail.fields;
       //console.log('fields: ', JSON.parse(JSON.stringify(fields)));
       // fields.Report_Subtitle__c = 'Subtitle here';
       this.template.querySelector('lightning-record-edit-form').submit(fields);
   }

   openIdLink(event) {
       var recordId = event.target.dataset.legerid;
       window.open('/' + recordId, "_blank");
   }

   allSelected(event) {
       const selectedRows = this.template.querySelectorAll('lightning-input');
       for (let i = 0; i < selectedRows.length; i++) {
           if (selectedRows[i].type === 'checkbox') {
               selectedRows[i].checked = event.target.checked;
           }
       }
   }

   submitDetails() {
       this.isModalOpen = false;
       this.showSpinner = true;
       let selectedCons = [];
       let selectedRows = this.template.querySelectorAll('lightning-input');
       for (let i = 0; i < selectedRows.length; i++) {
           if (selectedRows[i].checked && selectedRows[i].type === 'checkbox') {
               selectedCons.push(selectedRows[i].dataset.id);
               this.StandardReportRows.splice(selectedRows[i].dataset.id, 1)
               this.index--;
           }
       }
       if (selectedCons && selectedCons.length > 0) {
           deleteMultipleFinancialReportingRecord({ frrObj: selectedCons }).then(() => {
               this.showSpinner = false;
               const evt = new ShowToastEvent({
                   title: 'Success Message',
                   message: 'Record deleted successfully',
                   variant: 'success',
                   mode: 'dismissible'
               });
               this.dispatchEvent(evt);
           });
       }else{
           this.showSpinner = false;
           const evt = new ShowToastEvent({
                   title: 'No Records',
                   message: 'Select the records for delete',
                   variant: 'warning',
                   mode: 'dismissible'
               });
               this.dispatchEvent(evt);
       }
   }

   deleteSelectedRecords() {
       this.isModalOpen = true;
   }

   closeModal() {
       this.isModalOpen = false;
   }

   handleColumnClick(event) {
       let recordId = event.target.dataset.id;
       let frrId = event.target.dataset.frrId;
       //console.log('frrId2: ', frrId);

       var compDefinition = {
           componentDef: "c:asReportDetail",
           attributes: {
               recordId: recordId,
               frrId: frrId
           }
       };
       var encodedCompDef = btoa(JSON.stringify(compDefinition));
       window.open('/one/one.app#' + encodedCompDef, "_blank");
   }

   handleMenuSelect(event) {
       let seletedItem = event.detail.value;
       this.cardTitle = seletedItem;
   }

   closeToast() {
       this.isShowToast = false;
   }

   handleIncludeSubType1Change(event) {
       this.includeSubType1CheckBoxValue = event.target.checked;
       //console.log('includeSubType1CheckBoxValue: ', this.includeSubType1CheckBoxValue);
   }

   handleIncludeSubType2Change(event) {
       this.includeSubType2CheckBoxValue = event.target.checked;
      // console.log('includeSubType2CheckBoxValue: ', this.includeSubType2CheckBoxValue);
   }

   handleSuppressZeroAmountRowsChange(event) {
       this.suppressZeroAmountRowsCheckBoxValue = event.target.checked;
      // console.log('suppressZeroAmountRowsCheckBoxValue: ', this.suppressZeroAmountRowsCheckBoxValue);
   }

   handleRoundingChange(event) {
       this.roundingTextValue = event.target.value;
       console.log('roundingTextValue: ', this.roundingTextValue);
   }

   handleChange(event) {
       this.value = event.target.value;
       console.log('Value: ', this.value);
   }

   handleCurrencyChange(event) {
       this.currencyValue = event.target.value;
       console.log('currencyValue: ', this.currencyValue);
   }

   handleStartAccountingPeriod(event) {
       this.startAccountingPeriodId = event.target.value;
       console.log('this.startAccountingPeriodId: ', this.startAccountingPeriodId);
   }

   handleEndAccountingPeriod(event) {
       this.startAccountingPeriodId = event.target.value;
       console.log('this.startAccountingPeriodId: ', this.startAccountingPeriodId);
   }

   handleOnChange(event) {
       if (this.isGlAccShow) {
           this.isGlAccShow = false;
       } else {
           this.isGlAccShow = true;
       }
   }

   /////kartik//////
   get objectProperties() {
       return Object.entries(this.tempObj).map(([key,value])=>({ key, value }));
     }
   
     get subObjectProperties() {
       return Object.entries(this.tempObj).map(([key,value])=>{ return Object.entries(value).map(([k,v])=>({ k, v}))});
     }

    tempWrapObj = [];
   showRepData = false;
   showParent = true;
   showChild = true;
   showSubChild = true;
     tempFinal = [
                   {
                       showCollapse: false,
                       key:'Cost of Goods Sold',
                       colspan:0,
                       value:[]
                   },
                   {
                       showCollapse: false,
                       key:'Revenue',
                       colspan:0,
                       value:[]
                   },
                   {
                       showCollapse: true,
                       key:'GROSS PROFIT',
                       Amount:0,
                       colspan:this.columnData.length,
                       isFormula:true,
                       ColumnHeader1:'Total'
                   },
                   {
                       showCollapse: false,
                       key:'Expense',
                       value:[]
                   },
                   {
                       showCollapse: true,
                       key:'NET OPERATING INCOME',
                       Amount:0,
                       colspan:this.columnData.length,
                       isFormula:true,
                       ColumnHeader1:'Total'

                   },
                   {
                       showCollapse: false,
                       key:'Other Income',
                       colspan:0,
                       value:[]
                   },
                   {
                       showCollapse: false,
                       key:'Other Expenses',
                       value:[]
                   },
                   {
                       showCollapse: true,
                       key:'NET OTHER INCOME',
                       Amount:0,
                       colspan:this.columnData.length,
                       isFormula:true,
                       ColumnHeader1:'Total'
                   },
                   {
                       showCollapse: true,
                       key:'NET INCOME',
                       Amount:0,
                       colspan:this.columnData.length,
                       isFormula:true,
                       ColumnHeader1:'Total'
                   }];
     hideChild(event){
       //;
       //console.log(event.currentTarget.dataset.label);
       if(event.currentTarget.dataset.label =='parent'){
           console.log(this.showParent);
           this.showParent = !this.showParent;
       }
       else if(event.currentTarget.dataset.label =='child'){
           this.showChild = !this.showChild;
       }
       else if(event.currentTarget.dataset.label =='subChild'){
           this.showSubChild = !this.showSubChild
       }
      // this.template.querySelector('table').refresh();
      // this.tempWrapObj = [...this.tempWrapObj];
     }

   runReportNew(){
       this.tempFinal[2].Amount = 0;
       this.showRepData = false;
       // this.showParent = true;
       // this.showChild = true;
       // this.showSubChild = true;
       console.log('Before',JSON.stringify(this.tempWrapObj));
       this.tempWrapObj=[];
       console.log('After',JSON.stringify(this.tempWrapObj));
       var tempObj = {};
       // this.showSpinner = false;
       this.glKeyValueCounter++;
       this.glKeyValue =  Date.now().toString();
       // this.insertedRecordId = summeryId;
       // tempObj.glInsertedRecordId = this.insertedRecordId;
       tempObj.currencyValue = this.currencyValue;
       tempObj.includeSubType1CheckBoxValue = Boolean(this.includeSubType1CheckBoxValue);
       tempObj.includeSubType2CheckBoxValue = this.includeSubType2CheckBoxValue;
       tempObj.suppressZeroAmountRowsCheckBoxValue = this.suppressZeroAmountRowsCheckBoxValue;
       tempObj.roundingTextValue = this.roundingTextValue;
       tempObj.reportRounding = this.value;
       tempObj.startAccountingPeriodId = this.startAccountingPeriodId;
       tempObj.endAccountingPeriodId = this.endAccountingPeriodId;

       tempObj.reportPeriod = this.filter.reportPeriod;
       tempObj.displayColumn = this.filter.displayColumn;
       tempObj.reportTypeId = this.selectedReportTypeId;
       
       //console.log('tempObj: ', tempObj);
       fetchGLAccount({newItems: tempObj})
       .then(result=>{
           console.log(result);
           Object.keys(result.colMap)?.forEach(item=>{
               console.log(item);
               console.log(this.filter.displayColumn);
               if(this.filter.displayColumn == 'Totals Only'){
               console.log(result.colMap[item]);
                   result.colMap[item]?.forEach(item=>{
                    if(item.ColumnHeader1 == 'Total'){
                        this.columnData.push(item.ColumnHeader1);
                    }
                   })
                }
                else{
                   result.colMap[item]?.forEach(item=>{
                           this.columnData.push(item.ColumnHeader1);
                      })
                }
           })
           console.log(this.columnData);


           const treeData = {};
           Object.keys(result.Type)?.forEach(key => {
               result.Type[key]?.sort(function(a, b) {
                   return a.sortingNumber - b.sortingNumber;
           });
               result.Type[key]?.forEach(item => {
                
                   if (!treeData[item.RowType]) {
                     treeData[item.RowType] = [];
                   }

                   treeData[item.RowType].push(item);
                 });
             });

             // Assuming the object is stored in a variable named "data"


// Group by Type
Object.keys(result.SubType)?.forEach(subType => {
   result.SubType2[subType]?.sort(function(a, b) {
       return a.sortingNumber - b.sortingNumber;
});
   result.SubType2[subType]?.forEach(item => {

   if (!treeData[item.RowType][item.RowSubType]) {
     
     treeData[item.RowType][item.RowSubType] = [];
   }
   treeData[item.RowType][item.RowSubType].push(item);
 });
});

// Group by SubType
Object.keys(result.SubType2)?.forEach(subType => {
   result.SubType2[subType]?.sort(function(a, b) {
       return a.sortingNumber - b.sortingNumber;
});

   result.SubType2[subType]?.forEach(item => {
   if (!treeData[item.RowType]) {
     treeData[item.RowType] = {};
   }
   if (!treeData[item.RowType][item.RowSubType]) {
     treeData[item.RowType][item.RowSubType] = {};
   }
   if (!treeData[item.RowType][item.RowSubType][item.RowSubType1]) {
     treeData[item.RowType][item.RowSubType][item.RowSubType1] = [];
   }
   treeData[item.RowType][item.RowSubType][item.RowSubType1].push(item);
 });
});

//console.log(treeData);

let temp = [];

for(let key in treeData){
    let tempRow = [];
    console.log(treeData[key]);
    if(Array.isArray(treeData[key])){

    for( let rec of treeData[key]){
        let isExist1 = false;
       for(let key1 of tempRow){
        if(rec.RowLabel == key1.Name){
            key1.Value.push(rec)
            isExist1=true;
            break;
        }
       }
       if(!isExist1){
        var testArray= [];
        testArray.push(rec);
        tempRow.push({"Name":rec.RowLabel, "Value":testArray});
    }
       
     }
    }
    else{
        tempRow = treeData[key];
    }
console.log(tempRow);
   temp.push({
       'key': key,
       'value': tempRow,
       'hasChildObj':false
   });
}
temp.forEach(item=>{
   let tempArr = [];
  
   if(typeof item.value == 'object'){
       for( let key in item.value){

          if(isNaN(key)){
           tempArr.push({
           'Subkey': key,
           'Subvalue': item.value[key],
           'hasSubChildObj':false
       });
   }
   else{
       item.value = item.value;
   }
   }
   console.log(item);
   }
   if(tempArr.length != 0){
       tempArr.forEach(items=>{
           let subTempArr = [];
           if(typeof items.Subvalue == 'object'){
           for( let key in items.Subvalue){
               subTempArr.push({
               'Subkey1': key,
               'Subvalue1': items.Subvalue[key]
           });
           items.Subvalue =( (subTempArr) && subTempArr.length !=0)?subTempArr:items.Subvalue;

       }
       }
       })
   }
   //console.log(tempArr);
   item.value = ((tempArr) && tempArr.length !=0 )?tempArr:item.value;
})
console.log(temp);
temp?.forEach(type=>{
   type.value?.forEach(subType=>{
       if(subType.Subkey){
           type.hasChildObj = true;
       }
       subType.Subvalue?.forEach(subType1=>{
           if(subType1.Subkey1){
               subType.hasSubChildObj = true;
           }
       })
   })
})
//console.log(temp);
this.tempWrapObj = [...temp];
this.tempWrapObj.forEach(type=>{
   if(type.key == 'Revenue'){
       this.tempFinal[0] = type;
   }
   else if(type.key == 'Cost of Goods Sold'){
       this.tempFinal[1] = type;
   }
   else if(type.key == 'Expense'){
       this.tempFinal[3] = type;
   }
   else if(type.key == 'Cost of Goods Sold'){
       this.tempFinal[5] = type;
   }
   else if(type.key == 'Cost of Goods Sold'){
       this.tempFinal[6] = type;
   }
})
console.log(this.tempFinal);



let map = {};
console.log('Map Start--------------');
// iterate over each object in the array
for (let obj of this.tempWrapObj) {
  // console.log('OBJ ----------- ',JSON.stringify(obj));
   if(obj.hasChildObj){
 // if the object has a "value" property that is an array
 if (Array.isArray(obj.value)) {

   // iterate over each object in the "value" array
   for (let subobj of obj.value) {
      // console.log('VAlue --- ',JSON.stringify(subobj));
     // if the sub-object has a "Subvalue" property that is an array
     if (Array.isArray(subobj.Subvalue)) {

       // iterate over each object in the "Subvalue" array
       for (let subsubobj of subobj.Subvalue) {

         // if the sub-sub-object has a "ColumnHeader1" property with value "Total"
         for(let subsubobj1 of subobj.Subvalue){

           if (Array.isArray(subsubobj1.Subvalue1)) {
              // map[key] = 0;
               for(let subsubobj2 of subsubobj1.Subvalue1){
               if (subsubobj2.ColumnHeader1 === "Total") {

                   // extract the values we want to store in the map
                   let key = obj.key;
                   let amount = subsubobj2.Amount;

                   if (!map[key]) {
                     map[key] = 0;
                   }

                   map[key] += amount;
                 }
               }
           }
         }
        
       }
     }
     else if(subobj.Value){
        for(let subArr of subobj.Value){
            //console.log('Sub ARRR ----',JSON.stringify(subArr));
            if (subArr.ColumnHeader1 === "Total") {  
            if(!map[subArr.RowType]){
                map[subArr.RowType] = 0;
            }
            map[subArr.RowType] += subArr.Amount;
        }
        }
     }
     else{console.log('ELSE ARRY');}
     
   }
 }
}
else if(Array.isArray(obj.value)){
    console.log('ARRAY');
    console.log(obj.value);
    obj.value?.forEach(rec=>{
        rec.Value.forEach(record=>{
            if(record.ColumnHeader1 === "Total"){
            if(!map[obj.key]){
                map[obj.key] = 0;
            }
            map[obj.key] += record.Amount;
            console.log(map[obj.key]);
        }
        })
    })
}

}
console.log('map------->',JSON.stringify(map));
let grossProf=0;
let expenseVal = 0;
let otherIncome = 0;
let otherExpense = 0;
Object.keys(map).forEach(key=>{
   
   if(key == 'Revenue'){
       this.tempFinal[2].Amount += map[key];
       console.log('Revenue',this.tempFinal[2].Amount);
   }
   else if( key == 'Cost of Goods Sold'){
       this.tempFinal[2].Amount -= map[key];
       console.log('Cost of Good',this.tempFinal[2].Amount);

   }
   else if(key == 'Expense'){
       expenseVal = map[key];
   }
   else if(key == 'Other Income'){
    otherIncome = map[key];
   }
   else if(key == 'Other Expenses'){
    otherExpense = map[key];
   }
   

   console.log(grossProf);
   console.log(this.tempFinal[2]);
   //this.tempFinal[2].Amount = grossProf;
   map[key] = 0;
})
this.tempFinal[4].Amount =  this.tempFinal[2].Amount - expenseVal;
this.tempFinal[7].Amount =  otherIncome - otherExpense;
this.tempFinal[8].Amount =  this.tempFinal[4].Amount - this.tempFinal[7].Amount;
expenseVal = 0;
otherIncome = 0;
otherExpense = 0;
this.tempFinal[2].colspan = this.columnData.length;
this.tempFinal[4].colspan = this.columnData.length;
this.tempFinal[7].colspan = this.columnData.length;
this.tempFinal[8].colspan = this.columnData.length;
this.tempWrapObj = [];
this.tempWrapObj = [...this.tempFinal];
this.showRepData = true;

       })
       .catch(error=>{
           console.log(error);
           
       })
   }

   handleNavigate(event){
       //console.log(event.currentTarget.dataset.id);
       /*this[NavigationMixin.Navigate]({
           type: 'standard__recordRelationshipPage',
           attributes: {
               recordId: event.currentTarget.dataset.id,
               objectApiName: 'GFERP__GL_Account__c',
               relationshipApiName: 'GFERP__G_L_Entries__r',
               actionName: 'view'
           },
       });*/
      // window.open('/lightning/n/GL_Entries_Page?glaccountId='+event.currentTarget.dataset.id);
      //console.log('this.filter:'+JSON.stringify(this.filter));
      //console.log('startDate:'+event.currentTarget.dataset.label);
      let startdate=event.currentTarget.dataset.label;
      //console.log('startdate.length:'+startdate.length);
      if(startdate.length>7){
        startdate=startdate.substring(0,7);
      }
      //console.log('startdate:'+startdate);
      let displayColumn=this.filter.displayColumn;
      if(displayColumn.includes(' ')){
        displayColumn=displayColumn.replace(' ','');
      }
      displayColumn=displayColumn.trim(); 
      this[NavigationMixin.Navigate]({
        type: 'standard__navItemPage',
        attributes: {
            apiName: 'GL_Entries_App_Page',
        },
        state: {
            c__glaccountId: event.currentTarget.dataset.id,
            c__displayColumn: displayColumn,
            c__startDate: startdate
        }
    });
   }
}