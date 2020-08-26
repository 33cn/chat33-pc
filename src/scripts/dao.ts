import Datasource from '@/scripts/data-source';

export default abstract class Dao {
    protected dataSource:any
    protected constructor(dataSource:Datasource) {
        this.dataSource = dataSource;
    }
}


