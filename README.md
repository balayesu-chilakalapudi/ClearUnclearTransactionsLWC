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
Below is the HTML part of data-label which is used in java as event.currentTarget.dataset.label

```
<td key={subval1.ColumnHeader1}>
  <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
  <span class="slds-truncate" title={subval1.RowLabel} data-id={subval1.Id} data-label={subval1.ColumnHeader1} onclick={handleNavigate}><a>{subval1.Amount}</a></span>
  </div>
</td>
```

