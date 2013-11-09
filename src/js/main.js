$(function() {
  console.log('test')
  $('input').change(function() {
    alert($(this).val())
  })
})