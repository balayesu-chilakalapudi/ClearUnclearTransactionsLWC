public with sharing class ReconciliationLwcController {
    public class ReconciliationWrapper {
        @AuraEnabled
        public List<GFERP__GL_Entry__c> glEntryList;

        public ReconciliationWrapper() {
            glEntryList = new List<GFERP__GL_Entry__c>();
        }

    }

    @AuraEnabled
    public static ReconciliationWrapper fetchData(String recordId) {
        ReconciliationWrapper wrapper = new ReconciliationWrapper();
        try {
            Bank_Reconciliation__c theBankReconciliation = [
                    select id, Bank_Account__c, Bank_Account__r.Name, Ending_Balance_Difference__c, End_Date__c, Statement_Beginning_Balance__c
                    from Bank_Reconciliation__c
                    where Id = :recordId
            ];
            for (GFERP__GL_Entry__c entry : [
                    SELECT Id, Cleared__c, Bank_Reconciliation__c, Name, GFERP__GL_Account__c, GFERP__GL_Account__r.Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__r.Name, GFERP__Due_Date__c, GFERP__Transaction_Source__c, GFERP__Description__c, Customer_Payee__c, GFERP__Document_Type__c
                    FROM GFERP__GL_Entry__c
                    WHERE GFERP__GL_Account__c = :theBankReconciliation.Bank_Account__c /*AND GFERP__Document_Date__c <=: theBankReconciliation.End_Date__c*/
                    ORDER BY Name
            ]) {
                wrapper.glEntryList.add(entry);
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return wrapper;
    }
    @AuraEnabled
    public static ReconciliationWrapper GFERP_GL_Entry_Button_Handler(String recordId, String GFERP_GL_Entry_Id, String GFERP_GL_Entry_Button_Label) {
        ReconciliationWrapper wrapper = new ReconciliationWrapper();
        try {
            Bank_Reconciliation__c theBankReconciliation = [
                    select id, Cleared_Deposits__c, Bank_Account__c, Bank_Account__r.Name, Ending_Balance_Difference__c, End_Date__c, Statement_Beginning_Balance__c
                    from Bank_Reconciliation__c
                    where Id = :recordId
            ];
            GFERP__GL_Entry__c entry = [
                    SELECT Cleared__c, GFERP__Amount__c
                    FROM GFERP__GL_Entry__c
                    WHERE Id = :GFERP_GL_Entry_Id
                    limit 1
            ];
            //update bank reconciliation balances
            /*if (theBankReconciliation.Cleared_Amount__c == null) {
                theBankReconciliation.Cleared_Amount__c = 0;
            }*/
            if (theBankReconciliation.Cleared_Deposits__c == null) {
                theBankReconciliation.Cleared_Deposits__c = 0;
            }
            if (GFERP_GL_Entry_Button_Label.equals('Add')) {
                entry.cleared__c = true;
                //theBankReconciliation.Cleared_Amount__c += entry.GFERP__Amount__c;
                theBankReconciliation.Cleared_Deposits__c += entry.GFERP__Amount__c;
            } else {
                //remove value
                entry.cleared__c = false;
                //theBankReconciliation.Cleared_Amount__c -= entry.GFERP__Amount__c;
                theBankReconciliation.Cleared_Deposits__c -= entry.GFERP__Amount__c;
            }
            //update entry
            GFERP.CompanyMgmt.systemCall = true;
            // entry.GFERP__GL_Account__c = theBankReconciliation.Bank_Account__c;
            update entry;
            update theBankReconciliation;
            wrapper = fetchData(recordId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return wrapper;
    }

    @AuraEnabled
    public static ReconciliationWrapper clear_unclear_operation_handler(String recordId, String strEntryList, String clear_unclear_operation_title) {
        ReconciliationWrapper wrapper = new ReconciliationWrapper();
        try {
            Bank_Reconciliation__c theBankReconciliation = [
                    select id, Cleared_Deposits__c, Bank_Account__c, Bank_Account__r.Name, Ending_Balance_Difference__c, End_Date__c, Statement_Beginning_Balance__c
                    from Bank_Reconciliation__c
                    where Id = :recordId
            ];
            //update bank reconciliation balances
            /*if (theBankReconciliation.Cleared_Amount__c == null) {
                theBankReconciliation.Cleared_Amount__c = 0;
            }*/
            if (theBankReconciliation.Cleared_Deposits__c == null) {
                theBankReconciliation.Cleared_Deposits__c = 0;
            }
            List<GFERP__GL_Entry__c> entrylist = (List<GFERP__GL_Entry__c>) JSON.deserialize(strEntryList, List<GFERP__GL_Entry__c>.class);
            for (GFERP__GL_Entry__c entry : entrylist) {
                if (clear_unclear_operation_title == 'Clear All') {
                    entry.Cleared__c = true;
                   // theBankReconciliation.Cleared_Amount__c += entry.GFERP__Amount__c;
                    theBankReconciliation.Cleared_Deposits__c += entry.GFERP__Amount__c;
                } else {
                    entry.Cleared__c = false;
                   // theBankReconciliation.Cleared_Amount__c -= entry.GFERP__Amount__c;
                    theBankReconciliation.Cleared_Deposits__c -= entry.GFERP__Amount__c;
                }
            }
            GFERP.CompanyMgmt.systemCall = true;
            update entrylist;
            update theBankReconciliation;
            wrapper = fetchData(recordId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return wrapper;
    }

    @AuraEnabled
    public static ReconciliationWrapper filterActionHandler(String recordId, String filterParams) {
        ReconciliationWrapper wrapper = new ReconciliationWrapper();
        try {
            Bank_Reconciliation__c theBankReconciliation = [
                    select id, Bank_Account__c, Bank_Account__r.Name, Ending_Balance_Difference__c, End_Date__c, Statement_Beginning_Balance__c
                    from Bank_Reconciliation__c
                    where Id = :recordId
            ];
            Map<String, Object> filterObj = (Map<String, Object>) JSON.deserializeUntyped(filterParams);
            String bankAccount = theBankReconciliation.Bank_Account__c;
            System.debug('filterObj' + filterObj);
            String soql_query = 'SELECT Id, Cleared__c,GFERP__Document_Type__c, Bank_Reconciliation__c, Name,GFERP__GL_Account__c,GFERP__GL_Account__r.Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__r.Name, GFERP__Due_Date__c, GFERP__Transaction_Source__c, GFERP__Description__c, Customer_Payee__c' +
                    ' FROM GFERP__GL_Entry__c' +
                    ' WHERE GFERP__GL_Account__c =:bankAccount';
            if (!String.isEmpty((String) filterObj.get('SearchByRefDescPayee'))) {
                String SearchByRefDescPayee = (String) filterObj.get('SearchByRefDescPayee');
                soql_query += ' AND (Customer_Payee__c=:SearchByRefDescPayee OR GFERP__GL_Account__r.Name=:SearchByRefDescPayee OR GFERP__Description__c=:SearchByRefDescPayee)';
            }
            //Cleared_Uncleared
            if (!String.isEmpty((String) filterObj.get('Cleared_Uncleared')) && String.valueOf(filterObj.get('Cleared_Uncleared')).equals('Cleared Only')) {
                soql_query += ' AND Cleared__c=true';
            } else if (!String.isEmpty((String) filterObj.get('Cleared_Uncleared')) && String.valueOf(filterObj.get('Cleared_Uncleared')).equals('Uncleared Only')) {
                soql_query += ' AND Cleared__c=false';
            }
            //Date Filter
            if (!String.isEmpty((String) filterObj.get('DocFromDate')) && !String.isEmpty((String) filterObj.get('DocToDate'))) {
                Date fromdate = Date.valueOf((String) filterObj.get('DocFromDate'));
                Date todate = Date.valueOf((String) filterObj.get('DocToDate'));
                soql_query += ' AND (GFERP__Document_Date__c>=:fromdate AND GFERP__Document_Date__c<=:todate)';
            }
            if (!String.isEmpty((String) filterObj.get('AccountType'))) {
                String AccountType = (String) filterObj.get('AccountType');
                soql_query += ' AND GFERP__Document_Type__c=:AccountType';
            }
            if (!String.isEmpty((String) filterObj.get('FromAmount')) && !String.isEmpty((String) filterObj.get('ToAmount'))) {
                Decimal FromAmount = Decimal.valueOf((String) filterObj.get('FromAmount'));
                Decimal ToAmount = Decimal.valueOf((String) filterObj.get('ToAmount'));
                soql_query += ' AND (GFERP__Amount__c>=:FromAmount AND GFERP__Amount__c<=:ToAmount)';
            }
            System.debug('soql_query:' + soql_query);
            for (GFERP__GL_Entry__c entry : Database.query(soql_query)) {
                wrapper.glEntryList.add(entry);
            }
        } catch (Exception e) {
            throw new AuraHandledException(e + '\n' + e.getStackTraceString());
        }
        return wrapper;
    }

}