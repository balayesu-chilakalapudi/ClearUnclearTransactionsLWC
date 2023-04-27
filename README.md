# ClearUnclearTransactionsLWC

Below javascript code of LWC passes 3 parameters to Lightning App Page and the app page having one LWC inside and handles the parameters. Each parameter need to be prefixed with c___ like c__glaccountId, c__displayColumn, c__startDate

```
handleNavigate(event){      
      let startdate=event.currentTarget.dataset.label;
      if(startdate.length>7){
        startdate=startdate.substring(0,7);
      }
      let displayColumn=this.filter.displayColumn;
      if(displayColumn.includes(' ')){
        displayColumn=displayColumn.replace(' ','');
      }
      displayColumn=displayColumn.trim(); 
      //using NavigationMixin.Navigate send those 3 parameters to app page GL_Entries_App_Page
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
```
Below is the HTML part of data-label which is used in javascript as event.currentTarget.dataset.label

```
<td key={subval1.ColumnHeader1}>
  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
  <span class="slds-truncate" title={subval1.RowLabel} data-id={subval1.Id} data-label={subval1.ColumnHeader1} onclick={handleNavigate}><a>{subval1.Amount}</a></span>
  </div>
</td>
```
To receive the url parameters use the below code

```
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
```

Make the pagination dynamic by using the child LWC components pagination1LWC, pagination2LWC like below

```
<table class="slds-table slds-table_cell-buffer slds-table_bordered">
<tbody>
<template for:each={clearedTransactions} for:item="ct">
    <tr key={ct.Id} class="slds-line-height_reset">
        <td scope="col">
            <lightning-input class="slds-p-left_xx-large" type="checkbox"
                data-id="cleared" label="" value={ct.Id}
                onchange={handleClearedBox}></lightning-input>
        </td>
        <td scope="col">{ct.Customer_Payee__c}</td>
        <td scope="col">{ct.GFERP__Document_Date__c}</td>
        <td scope="col">{ct.GFERP__Amount__c}</td>
        <td scope="col"></td>
        <td scope="col"></td>
    </tr>
</template>
</tbody>
</table>
<div slot="footer" class="slds-var-m-vertical_medium">
  <c-clear-transaction-pagination records={dataObj.clearedTransactions} record-size="5"
      onupdate={updateClearedTransactions}></c-clear-transaction-pagination>
</div>
```


