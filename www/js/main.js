var list_names = ["A","B","c"]

function pick_up_name(names_box_id) {
  // Short list before pick an element up from the end (pop)
  list_names.sort(() => Math.random() - 0.5);
  // Get the element where names show up & replace content
  document.getElementById('names_box').textContent = list_names.pop();
}

setInterval(pick_up_name, 5000);
