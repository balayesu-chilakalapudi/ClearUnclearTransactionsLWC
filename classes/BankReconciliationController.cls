public class BankReconciliationController {
    public Integer UnclearedPageSize { get; set; }
    public Integer UnclearedPageNumber { get; set; }
    public Integer UnclearedRecordCount { get; set; }
    public Integer PageSize { get; set; }
    public Integer PageNumber { get; set; }
    public Integer RecordCount { get; set; }
    public String theSearchStr { get; set; }
    public Bank_Reconciliation__c theBankReconciliation { get; set; }
    public List<GFERP__GL_Entry__c> theUnclearedList { get; set; }
    public List<GFERP__GL_Entry__c> theClearedList { get; set; }
    public Boolean allClearedTransactions { get; set; }
    public Boolean allUnClearedTransactions { get; set; }
    public Boolean ClearedTransactions = false;
    public Boolean UnClearedTransactions = false;
    public String defaultCurrencyCode { get; set; }
    public List<GFERP__GL_Entry__c> UnclearedList ;
    public List<GFERP__GL_Entry__c> ClearedList ;

    public Decimal theClearedTransaction { get; set; }
    public Decimal ClearedTransaction = 0;
    AggregateResult[] thegroupedSumResults;
    public List<SelectOption> GLAccounts { get; set; }

    public String sortDir {
        get {
            if (sortDir == null) {
                sortDir = 'asc';
            } return sortDir;
        }
        set;
    }
    public String UnclearsortDir {
        get {
            if (UnclearsortDir == null) {
                UnclearsortDir = 'asc';
            } return UnclearsortDir;
        }
        set;
    }
    public String sortField = 'Name';
    public String UnclearedsortField = 'Name';
    public String theBRId;

    public BankReconciliationController(ApexPages.StandardController stdController) {
        PageSize = 100;
        PageNumber = 1;
        UnclearedPageSize = 100;
        UnclearedPageNumber = 1;
        allUnClearedTransactions = false;
        allClearedTransactions = false;
        defaultCurrencyCode = UserInfo.getDefaultCurrency();

        theBRId = ApexPages.CurrentPage().getParameters().get('id');
        if (theBRId != null) {
            getBR();
        }

        UnclearedRecordCount = [SELECT Count() FROM GFERP__GL_Entry__c WHERE Cleared__c = false and GFERP__GL_Account__c = :theBankReconciliation.Bank_Account__c];
        RecordCount = [SELECT Count() FROM GFERP__GL_Entry__c WHERE Cleared__c = true and GFERP__GL_Account__c = :theBankReconciliation.Bank_Account__c and Bank_Reconciliation__c = :theBankReconciliation.Id];

        getUnclearedTrasanctions();
        getClearedTrasanctions();

        List<GFERP__GL_Account__c> theGLAccounts = [
                SELECT Id, Name
                FROM GFERP__GL_Account__c
                WHERE GFERP__Bank_Account__c = true
                Order By Name
        ];

        GLAccounts = new List<SelectOption>();
        for (GFERP__GL_Account__c theGLAccount : theGLAccounts) {
            GLAccounts.add(new SelectOption(theGLAccount.Id, theGLAccount.Name));
        }

        theBankReconciliation.End_Date__c = Date.today().toStartOfMonth().addDays(-1);

        if (thegroupedSumResults != null) {
            for (AggregateResult theAR : thegroupedSumResults) {
                if (theAR.get('SumAmount') != null) ClearedTransaction = Decimal.valueof(String.valueOf(theAR.get('SumAmount')));
            }
        }
        this.theClearedTransaction = ClearedTransaction;
    }

    public List<GFERP__GL_Entry__c> getClearedTrasanctions() {

        List<GFERP__GL_Entry__c> theClearedSortedList = new List<GFERP__GL_Entry__c>();
        try {
            ClearedList = [
                    SELECT Id, Cleared__c, Bank_Reconciliation__c,
                            Name, GFERP__Amount__c, GFERP__Document_Date__c,GFERP__Account__c, GFERP__Account__r.Name
                    FROM GFERP__GL_Entry__c
                    WHERE Cleared__c = true and GFERP__GL_Account__c = :theBankReconciliation.Bank_Account__c and Bank_Reconciliation__c = :theBankReconciliation.Id
                    order by Name
                    Limit :PageSize
                    offset :Offset
            ];

            theClearedList = createSortingWrapper(ClearedList, 'Cleared');
            return theClearedList;
        } catch (QueryException e) {
            ApexPages.addMessages(e);
            return null;
        }
    }

    public List<GFERP__GL_Entry__c> getUnclearedTrasanctions() {

        List<GFERP__GL_Entry__c> theUnclearedSortedList = new List<GFERP__GL_Entry__c>();
        try {

            UnclearedList = [
                    SELECT Id, Cleared__c, Bank_Reconciliation__c,
                            Name, GFERP__Amount__c, GFERP__Document_Date__c, GFERP__Account__r.Name
                    FROM GFERP__GL_Entry__c
                    WHERE Cleared__c = false and GFERP__GL_Account__c = :theBankReconciliation.Bank_Account__c AND GFERP__Document_Date__c <= :theBankReconciliation.End_Date__c
                    ORDER BY Name
                    Limit :UnclearedPageSize
                    offset :UnclearedOffset
            ];

            theUnclearedSortedList = createSortingWrapper(UnclearedList, 'UnCleared');
            theUnclearedList = theSearch(theUnclearedSortedList);
            return theUnclearedList;
        } catch (QueryException e) {
            ApexPages.addMessages(e);
            return null;
        }
    }

    public List<GFERP__GL_Entry__c> createSortingWrapper(List<GFERP__GL_Entry__c> theTransactionsList, String theTransactionType) {

        List<TranactionWrapper> theTransactionWrapperList = new List<TranactionWrapper>();
        List<GFERP__GL_Entry__c> theSortedTransactionList = new List<GFERP__GL_Entry__c>();
        String theField;
        String theDir;

        if (theTransactionType == 'Cleared') {
            theField = sortField;
            theDir = sortDir;
        } else if (theTransactionType == 'UnCleared') {
            theField = UnclearedsortField;
            theDir = UnclearsortDir;
        }

        for (GFERP__GL_Entry__c theTransaction : theTransactionsList) {

            if (theTransactionType == 'Cleared') theTransaction.Cleared__c = false;
            theTransactionWrapperList.add(new TranactionWrapper (theTransaction, theField, theDir, null));
        }
        theTransactionWrapperList.sort();

        for (TranactionWrapper theWrap : theTransactionWrapperList) {
            theSortedTransactionList.add(theWrap.transaction1);
        }

        return theSortedTransactionList;
    }

    public List<GFERP__GL_Entry__c> theSearch(List<GFERP__GL_Entry__c> theTransactionList) {
        String thStr = theSearchStr;
        List<GFERP__GL_Entry__c> theSearchClearedTransactionList = new List<GFERP__GL_Entry__c>();
        if (theSearchStr != null && theSearchStr != '') {
            List<GFERP__GL_Entry__c> theUnclearedTransactionList = theTransactionList;
            for (GFERP__GL_Entry__c theUnclearedTrans : theUnclearedTransactionList) {

                if (theUnclearedTrans.GFERP__Account__c != null && theUnclearedTrans.GFERP__Account__r.Name.Contains(theSearchStr)) theSearchClearedTransactionList.add(theUnclearedTrans);

            }
            return theSearchClearedTransactionList;
        } else {
            return theTransactionList;
        }
    }

    public void allCheckUnCleared() {
        List<GFERP__GL_Entry__c> UnclearedList = theUnclearedList;
        if (allUnClearedTransactions != null && allUnClearedTransactions) {
            for (GFERP__GL_Entry__c tran : UnclearedList) {
                tran.Cleared__c = true;
            }
            UnClearedTransactions = true;
        } else if (allUnClearedTransactions == null) {
            for (GFERP__GL_Entry__c tran : UnclearedList) {
                tran.Cleared__c = false;
            }
            UnClearedTransactions = false;
        } else if (allUnClearedTransactions == false && UnClearedTransactions == true) {
            for (GFERP__GL_Entry__c tran : UnclearedList) {
                tran.Cleared__c = false;
            }
            UnClearedTransactions = false;
        }
        theUnclearedList = UnclearedList;
    }

    public void allCheckCleared() {
        List<GFERP__GL_Entry__c> clearedList = theClearedList;
        if (allClearedTransactions != null && allClearedTransactions) {
            for (GFERP__GL_Entry__c tran : clearedList) {
                tran.Cleared__c = true;
            }
            ClearedTransactions = true;
        } else if (allClearedTransactions == null) {
            for (GFERP__GL_Entry__c tran : clearedList) {
                tran.Cleared__c = false;
            }
            ClearedTransactions = false;
        } else if (allClearedTransactions == false && ClearedTransactions == true) {
            for (GFERP__GL_Entry__c tran : clearedList) {
                tran.Cleared__c = false;
            }
            ClearedTransactions = false;
        }
        theClearedList = clearedList;
    }

    public void getBR() {
        theBankReconciliation = [
                SELECT Id, End_Date__c, Bank_Account__c,
                        Ending_Balance_Difference__c, Statement_Beginning_Balance__c, Bank_Account__r.name, Statement_Ending_Balance__c
                FROM Bank_Reconciliation__c
                WHERE Id = :theBRId
        ];

       // theClearedTransaction = theBankReconciliation.Cleared_Amount__c;
        thegroupedSumResults = [SELECT SUM(GFERP__Amount__c)SumAmount FROM GFERP__GL_Entry__c WHERE Bank_Reconciliation__c = :theBRId AND Cleared__c = true];
    }

    public integer UnclearedPageIndex {
        get {
            return (UnclearedPageNumber - 1);
        }
    }
    public integer UnclearedPageCount {
        get {
            return unClearedgetPageCount();
        }
    }
    public integer UnclearedOffset {
        get {
            return (UnclearedPageSize * UnclearedPageIndex);
        }
    }
     public Integer PageIndex {
        get {
            return (PageNumber - 1);
        }
    }
    public Integer PageCount {
        get {
            return getClearedPageCount();
        }
    }
    public Integer Offset {
        get {
            return (PageSize * PageIndex);
        }
    }

    public integer unClearedgetPageCount() {
        allCheckCleared();
        allCheckUnCleared();
        integer iPageCount = 1;
        if (UnclearedRecordCount != 0 && UnclearedPageSize != 0) {
            iPageCount = (UnclearedRecordCount / UnclearedPageSize) + ((Math.mod(UnclearedRecordCount, UnclearedPageSize)) > 0 ? 1 : 0);
        }
        return iPageCount;
    }

    public integer getClearedPageCount() {
        integer iPageCount = 1;
        if (RecordCount != 0 && PageSize != 0) {
            iPageCount = (RecordCount / PageSize) + ((Math.mod(RecordCount, PageSize)) > 0 ? 1 : 0);
        }
        allCheckCleared();
        allCheckUnCleared();
        return iPageCount;
    }

    public class TranactionWrapper implements Comparable {
        public GFERP__GL_Entry__c transaction1;
        public String theSourceField;
        public String sortField;
        public String theDIR;
        public TranactionWrapper(GFERP__GL_Entry__c theTransaction, String sortField1, String DIR, String SourceField) {
            transaction1 = theTransaction;
            sortField = sortField1;
            theDIR = DIR;
            theSourceField = SourceField;
        }

        public Integer compareTo(Object compareTo) {
            TranactionWrapper compareToOppy = (TranactionWrapper) compareTo;
            Integer returnValue = 0;

            if (theDIR == 'desc') {
                if (sortField != 'GFERP__Amount__c' && sortField != 'Reference' && sortField != 'Disbursement') {
                    if (String.valueof(transaction1.get(sortField)) > String.valueof(compareToOppy.transaction1.get(sortField))) returnValue = -1; else if (String.valueof(transaction1.get(sortField)) < String.valueof(compareToOppy.transaction1.get(sortField))) returnValue = 1;
                } else if (sortField == 'Disbursement') {
                    if (theSourceField > compareToOppy.theSourceField) returnValue = -1; else if (theSourceField < compareToOppy.theSourceField) returnValue = 1;
                } else {
                    if (Integer.valueof(transaction1.get(sortField)) > Integer.valueof(compareToOppy.transaction1.get(sortField))) returnValue = -1; else if (Integer.valueof(transaction1.get(sortField)) < Integer.valueof(compareToOppy.transaction1.get(sortField))) returnValue = 1;
                }
            } else {
                if (sortField != 'GFERP__Amount__c' && sortField != 'Reference' && sortField != 'Disbursement') {
                    if (String.valueof(transaction1.get(sortField)) > String.valueof(compareToOppy.transaction1.get(sortField))) returnValue = 1; else if (String.valueof(transaction1.get(sortField)) < String.valueof(compareToOppy.transaction1.get(sortField))) returnValue = -1;
                } else if (sortField == 'Disbursement') {
                    if (theSourceField > compareToOppy.theSourceField) returnValue = 1; else if (theSourceField < compareToOppy.theSourceField) returnValue = -1;
                } else {
                    if (Integer.valueof(transaction1.get(sortField)) > Integer.valueof(compareToOppy.transaction1.get(sortField))) returnValue = 1; else if (Integer.valueof(transaction1.get(sortField)) < Integer.valueof(compareToOppy.transaction1.get(sortField))) returnValue = -1;
                }
            }
            return returnValue;
        }
    }

    public PageReference updateBeginingBalance() {
        List<Bank_Reconciliation__c> theLastBRList = [SELECT Id, End_Date__c FROM Bank_Reconciliation__c WHERE Bank_Account__c = :theBankReconciliation.Bank_Account__c Order BY CreatedDate DESC LIMIT 1];

        if (!theLastBRList.isEmpty() && theLastBRList[0].Id != theBankReconciliation.Id) {
           // theBankReconciliation.Statement_Beginning_Balance__c = theLastBRList[0].Ending_Balance__c;
        } else {
            theBankReconciliation.End_Date__c = Date.today().toStartOfMonth().addDays(-1);
            theBankReconciliation.Statement_Beginning_Balance__c = 0;
           // theBankReconciliation.Ending_Balance__c = 0;
        }
        return null;
    }

    public PageReference saveBankReconciliation() {
        try {
            Bank_Reconciliation__c theBalanceReconciliation = theBankReconciliation;
            //theBalanceReconciliation.Cleared_Amount__c = theClearedTransaction;
            upsert theBankReconciliation;
            ApexPages.addMessage(new ApexPages.message(ApexPages.severity.CONFIRM, 'Saved Successfully!'));
            PageReference myVFPage = new PageReference('/' + theBankReconciliation.Id);
            myVFPage.setRedirect(true);
            return myVFPage;
        } Catch (Exception e) {
            ApexPages.addMessage(new ApexPages.message(ApexPages.severity.ERROR, e.getMessage()));
        }
        return null;
    }

    public PageReference cancel() {
        return new ApexPages.Action('{!List}').invoke();
    }
}