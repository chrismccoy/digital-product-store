/**
 * Chip input for product tags.
 */
(function () {
  var wrap = document.querySelector("[data-tag-input-wrap]");
  if (!wrap) return;

  var input = wrap.querySelector("[data-tag-input]");
  var hidden = wrap.querySelector('input[name="tags"]');
  var chipList = wrap.querySelector("[data-tag-chips]");
  if (!input || !hidden || !chipList) return;

  var tags = (hidden.value || "")
    .split(",")
    .map(function (t) { return t.trim(); })
    .filter(Boolean);

  function sync() {
    hidden.value = tags.join(", ");
    chipList.innerHTML = "";
    tags.forEach(function (tag, index) {
      var chip = document.createElement("span");
      chip.className =
        "inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 text-xs font-semibold";
      chip.textContent = tag;
      var x = document.createElement("button");
      x.type = "button";
      x.setAttribute("aria-label", "Remove " + tag);
      x.className = "text-brand-400 hover:text-brand-700 leading-none";
      x.textContent = "×";
      x.addEventListener("click", function () {
        tags.splice(index, 1);
        sync();
      });
      chip.appendChild(x);
      chipList.appendChild(chip);
    });
  }

  function addFromInput() {
    var value = input.value.trim().replace(/,+$/, "").trim();
    if (value && tags.indexOf(value) === -1) {
      tags.push(value);
      sync();
    }
    input.value = "";
  }

  input.addEventListener("keydown", function (e) {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addFromInput();
    } else if (e.key === "Backspace" && !input.value && tags.length) {
      tags.pop();
      sync();
    }
  });

  input.addEventListener("blur", addFromInput);
  var form = wrap.closest("form");
  if (form) form.addEventListener("submit", addFromInput);

  sync();
})();
