public with sharing class GLEntriesPageLwcController {
    public GLEntriesPageLwcController() {

    }
    @AuraEnabled
    public static GLDataWrapper getGLData(String glaccountId,String displayColumn,String startDate){
        System.debug('glaccountId:'+glaccountId);
        System.debug('displayColumn:'+displayColumn);
        System.debug('startDate:'+startDate);
        GLDataWrapper datawrapper=new GLDataWrapper();
        try {
            String query='SELECT Id,(select id,name,GFERP__Account__c,GFERP__Account__r.Name,GFERP__Description__c,GFERP__Document_No__c,GFERP__Posting_Date__c,GFERP__Amount__c,GFERP__Transaction_Source__c from GFERP__G_L_Entries__r';
            if(!String.isEmpty(displayColumn) && !String.isEmpty(startDate)){
                Date startDatedt=Date.valueOf(startDate+'-01');
                Date endDatedt;
                if(displayColumn.equals('ByMonth')){
                    endDatedt=startDatedt+(date.daysInMonth(startDatedt.year(), startDatedt.month()));
                }
                else if(displayColumn.equals('TotalsOnly')){
                    endDatedt=startDatedt.addYears(1);
                }
                system.debug('startDatedt:'+startDatedt);
                system.debug('endDatedt:'+endDatedt);
                query+=' WHERE (GFERP__Posting_Date__c>=:startDatedt AND GFERP__Posting_Date__c<=:endDatedt)';
            }
            query+=') from GFERP__GL_Account__c';
           
            if(!String.isEmpty(glaccountId)){
                query+=' WHERE Id=:glaccountId';
            }
            
            system.debug('query:'+query);
            List<GFERP__GL_Account__c> glaccounts=(List<GFERP__GL_Account__c>)Database.query(query);
            if(!glaccounts.isEmpty()){
                datawrapper.glAccount=glaccounts.get(0);
                datawrapper.glEntries=glaccounts.get(0).GFERP__G_L_Entries__r;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return datawrapper;
    }

    public class GLDataWrapper{    
        @AuraEnabled     
        public List<GFERP__GL_Entry__c> glEntries=new List<GFERP__GL_Entry__c>();
        @AuraEnabled          
        public GFERP__GL_Account__c glAccount=new GFERP__GL_Account__c();
    }

}