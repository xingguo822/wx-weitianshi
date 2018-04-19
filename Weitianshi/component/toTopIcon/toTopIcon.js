Component({
  properties: {

  },
  data: {

  },
  methods: {
    // 置顶
    toTop(){
      this.triggerEvent('toTop', {})
    }
  }
})
