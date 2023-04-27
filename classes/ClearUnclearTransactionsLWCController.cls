public class ClearUnclearTransactionsLWCController{
    public static List<GFERP__GL_Entry__c> getUnclearedTransactions(String recordId){
        List<GFERP__GL_Entry__c> UnclearedList = new List<GFERP__GL_Entry__c>();
        Bank_Reconciliation__c theBankReconciliation = [select id, end_date__c, Bank_Account__c from Bank_Reconciliation__c
                                                        where Id = :recordId];
        
        String GFERP_GL_Account = theBankReconciliation.Bank_Account__c;
        Date End_Date = theBankReconciliation.End_Date__c;
        String query = 'SELECT Id, Customer_Payee__c,Cleared__c, Bank_Reconciliation__c, ' + 
                     'Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__r.Name FROM GFERP__GL_Entry__c ' + 
                     'WHERE Cleared__c = false and GFERP__GL_Account__c =: GFERP_GL_Account';
        if (End_Date != null){
            query += ' AND GFERP__Document_Date__c <=: End_Date';
        }
        //query += ' ORDER BY Name';

        UnclearedList = Database.query(query);

        return UnclearedList;
    }

    public static List<GFERP__GL_Entry__c> getClearedTransactions(String recordId){
        List<GFERP__GL_Entry__c> clearedList = new List<GFERP__GL_Entry__c>();
        Bank_Reconciliation__c theBankReconciliation = [select id, end_date__c, Bank_Account__c
                                                        from Bank_Reconciliation__c
                                                        where Id = :recordId];
        String GFERP_GL_Account = theBankReconciliation.Bank_Account__c;
        Date End_Date = theBankReconciliation.End_Date__c;
        List<GFERP__GL_Entry__c> UnclearedList = new List<GFERP__GL_Entry__c>();
        String query = 'SELECT Id, Customer_Payee__c,Cleared__c, Bank_Reconciliation__c,' + 
                     'Name, GFERP__Amount__c, GFERP__Document_Date__c,GFERP__Account__c, GFERP__Account__r.Name FROM GFERP__GL_Entry__c ' + 
                     'WHERE Cleared__c = true and GFERP__GL_Account__c =: GFERP_GL_Account';
        if (End_Date != null){
            // Date enddate=Date.valueOf(enddatestr);
            query += ' AND GFERP__Document_Date__c <=: End_Date';
        }
        //query += ' ORDER BY Name';

        clearedList = Database.query(query);

        return UnclearedList;
    }

    public class BankReconciliationWrapper{
        @AuraEnabled
        public List<GFERP__GL_Entry__c> unclearedTransactions;
        @AuraEnabled
        public List<GFERP__GL_Entry__c> clearedTransactions;
        @AuraEnabled
        public Bank_Reconciliation__c Bank_Reconciliation;
    }

    @AuraEnabled
    public static BankReconciliationWrapper fetchDataWrapper(String recordId){
        BankReconciliationWrapper data = new BankReconciliationWrapper();
        try{
            data.unclearedTransactions = getUnclearedTransactions(recordId);
            data.clearedTransactions = getClearedTransactions(recordId);
            Bank_Reconciliation__c theBankReconciliation = [select id, Bank_Account__c, Bank_Account__r.Name, Cleared_Amount__c, Calculated_Ending_Balance__c, Ending_Balance_Difference__c, End_Date__c, Beginning_Balance__c, Ending_Balance__c
                                                            from Bank_Reconciliation__c
                                                            where Id = :recordId];
            data.Bank_Reconciliation = theBankReconciliation;

            //fill dummy data
            //data.unclearedTransactions = getUnclearDummyData();
            //data.clearedTransactions = getClearDummyData();
        } catch (Exception ex){
            throw new AuraHandledException('Exception:' + ex + '\n' + ex.getStackTraceString());
        }
        return data;
    }
/*
    public static List<GFERP__GL_Entry__c> getClearDummyData(){
        List<GFERP__GL_Entry__c> transactions = new List<GFERP__GL_Entry__c>();
        for (GFERP__GL_Entry__c entry : [SELECT Id,Customer_Payee__c, Cleared__c, Bank_Reconciliation__c, Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__c, GFERP__Account__r.Name
                                         FROM GFERP__GL_Entry__c
                                         where GFERP__Account__c != null
                                         and GFERP__Document_Date__c!=NULL
                                         and GFERP__Amount__c!=null
                                         and Cleared__c=true]){
            transactions.add(entry);
        }
        return transactions;
    }
    public static List<GFERP__GL_Entry__c> getUnclearDummyData(){
        List<GFERP__GL_Entry__c> transactions = new List<GFERP__GL_Entry__c>();
        for (GFERP__GL_Entry__c entry : [SELECT Id, Customer_Payee__c,Cleared__c, Bank_Reconciliation__c, Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__c, GFERP__Account__r.Name
                                         FROM GFERP__GL_Entry__c
                                         where GFERP__Account__c != null
                                         and GFERP__Document_Date__c!=NULL
                                         and GFERP__Amount__c!=null
                                         and Cleared__c=false]){
            transactions.add(entry);
        }
        return transactions;
    }
*/
    @AuraEnabled
    public static void saveUnclearedBoxes(String boxIdStr){
        try {
            Set<Id> Ids=new Set<Id>();
            if(boxIdStr!='' && boxIdStr.contains(',')){
                for(String s:boxIdStr.split(',')){
                    Ids.add(s);
                }
            }else{
                Ids.add(boxIdStr);
            }
            List<GFERP__GL_Entry__c> records = new List<GFERP__GL_Entry__c>();
            for(GFERP__GL_Entry__c entry : [SELECT Id,Cleared__c FROM GFERP__GL_Entry__c where Id IN:Ids]){
                entry.Cleared__c = true;
                records.add(entry);
            }
            GFERP.CompanyMgmt.systemCall = true;
            update records;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void saveClearedBoxes(String boxIdStr){
        try {
            Set<Id> Ids=new Set<Id>();
            if(boxIdStr!='' && boxIdStr.contains(',')){
                for(String s:boxIdStr.split(',')){
                    Ids.add(s);
                }
            }else{
                Ids.add(boxIdStr);
            }
            List<GFERP__GL_Entry__c> records = new List<GFERP__GL_Entry__c>();
            for(GFERP__GL_Entry__c entry : [SELECT Id,Cleared__c FROM GFERP__GL_Entry__c where Id IN:Ids]){
                entry.Cleared__c = false;
                records.add(entry);
            }
            GFERP.CompanyMgmt.systemCall = true;
            update records;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}