 <template>
  <div class="container card">
    <b-loading :is-full-page="false" :active.sync="loading" :canCancel="true"></b-loading>
    <div class="card-header">
      <div class="card-header-title is-centered">
        Relationship about
      <a class="button is-danger is-small is-outlined"  @click="routeTo('disease', name)">{{name}}</a>
      <span>with</span>
      <div class="is-grouped is-grouped-multiline">
      <a class="button is-success is-small is-outlined" v-for="g in genes" :key="g"  @click="routeTo('gene', g)">{{g}}</a>
      </div>
      </div>
    </div>
    <div class="card-content">
      <RelDiagram style="height: 480px" :name="name"
      :datas="datas"></RelDiagram>
<!--       <div class="columns">
        <div class="column"></div>
        <div class="column is-three-quarters"> -->
          <b-table :data="datas">
          <template slot-scope="props">
            <b-table-column centered
              field="d" label="Disease">
              <a class="button is-danger is-small is-outlined"
                  @click="routeTo('disease', props.row.d)">{{props.row.d}}</a>
            </b-table-column>
            <b-table-column centered
              field="g" label="Related Genes">
              <a class="button is-success is-small is-outlined" v-for="gene in props.row.g" :key="gene" @click="routeTo('gene', gene)">{{gene}}</a>
            </b-table-column>
            <b-table-column centered
              field="p" label="P-Value"
            >{{props.row.p}}</b-table-column>
          </template>
          </b-table>
<!--         </div>
        <div class="column"></div>
      </div> -->
    </div>
  </div>
</template>

<script>
  import RelDiagram from './RelDiagram';
  import { debounce } from 'debounce';
  export default {
    name: "DGRelation",
    components: {
      RelDiagram
    },
    props: ['name', 'genestr', 'db', 'query'],
    data: () => ({
      // name: 'disease',
      datas: [],
      genes: [],
      loading: false
    }),
    watch: {
      query: function() {
        this.refreshData();
      },
      name: function(cur, old) {
        this.refreshData();
      },
      db: function(cur, old) {
        this.refreshData();
      }
    },
    created: function () {
      this.refreshData();
    },
    methods: {
      refreshData: debounce(function() {
        if (this.genestr === undefined) return;
        if (this.genestr.length === 0) return;
        this.loading = true;
        // this.name = this.$route.params.name;
        // let genes = this.$route.params.genes;
        // this.genes = genes.split(',')
        this.genes = this.genestr.toUpperCase().split(/\s+/);
        let genes = this.genes.join(',');
        const that = this;
        this.$http.get('/api/pvalue/' + genes + '/' + this.db).then(res => {
          console.log(res.data.cond, that.genestr.toUpperCase().split(/\s+/).join(','));
          if (res.data.cond === that.genestr.toUpperCase().split(/\s+/).join(',')) {
            that.datas = res.data.pvalues;
          }
          that.loading = false;
        });
      }, 500),
      routeTo: function(type, name) {
        this.$router.replace('/' + type + '/' + name);
      },
      emitTags: function() {
        let tags = [{n: this.name, t: 'd?'}];
        for (let g of this.genes)
          tags.push({n: g, t: 'g?'});
        // this.$emit('emitTags', tags);
      }
    }
  }
</script>

<style scoped>
.button {
  margin: 5px;
}

.card-content {
  text-align: center;
}

</style>
