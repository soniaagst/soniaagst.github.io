(function($) {

	/**
	 * Generate an indented list of links from a nav. Meant for use with panel().
	 * @return {jQuery} jQuery object.
	 */
	$.fn.navList = function() {

		var	$this = $(this);
			$a = $this.find('a'),
			b = [];

		$a.each(function() {

			var	$this = $(this),
				indent = Math.max(0, $this.parents('li').length - 1),
				href = $this.attr('href'),
				target = $this.attr('target');

			b.push(
				'<a ' +
					'class="link depth-' + indent + '"' +
					( (typeof target !== 'undefined' && target != '') ? ' target="' + target + '"' : '') +
					( (typeof href !== 'undefined' && href != '') ? ' href="' + href + '"' : '') +
				'>' +
					'<span class="indent-' + indent + '"></span>' +
					$this.text() +
				'</a>'
			);

		});

		return b.join('');

	};

	/**
	 * Panel-ify an element.
	 * @param {object} userConfig User config.
	 * @return {jQuery} jQuery object.
	 */
	$.fn.panel = function(userConfig) {

		// No elements?
			if (this.length == 0)
				return $this;

		// Multiple elements?
			if (this.length > 1) {

				for (var i=0; i < this.length; i++)
					$(this[i]).panel(userConfig);

				return $this;

			}

		// Vars.
			var	$this = $(this),
				$body = $('body'),
				$window = $(window),
				id = $this.attr('id'),
				config;

		// Config.
			config = $.extend({

				// Delay.
					delay: 0,

				// Hide panel on link click.
					hideOnClick: false,

				// Hide panel on escape keypress.
					hideOnEscape: false,

				// Hide panel on swipe.
					hideOnSwipe: false,

				// Reset scroll position on hide.
					resetScroll: false,

				// Reset forms on hide.
					resetForms: false,

				// Side of viewport the panel will appear.
					side: null,

				// Target element for "class".
					target: $this,

				// Class to toggle.
					visibleClass: 'visible'

			}, userConfig);

			// Expand "target" if it's not a jQuery object already.
				if (typeof config.target != 'jQuery')
					config.target = $(config.target);

		// Panel.

			// Methods.
				$this._hide = function(event) {

					// Already hidden? Bail.
						if (!config.target.hasClass(config.visibleClass))
							return;

					// If an event was provided, cancel it.
						if (event) {

							event.preventDefault();
							event.stopPropagation();

						}

					// Hide.
						config.target.removeClass(config.visibleClass);

					// Post-hide stuff.
						window.setTimeout(function() {

							// Reset scroll position.
								if (config.resetScroll)
									$this.scrollTop(0);

							// Reset forms.
								if (config.resetForms)
									$this.find('form').each(function() {
										this.reset();
									});

						}, config.delay);

				};

			// Vendor fixes.
				$this
					.css('-ms-overflow-style', '-ms-autohiding-scrollbar')
					.css('-webkit-overflow-scrolling', 'touch');

			// Hide on click.
				if (config.hideOnClick) {

					$this.find('a')
						.css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');

					$this
						.on('click', 'a', function(event) {

							var $a = $(this),
								href = $a.attr('href'),
								target = $a.attr('target');

							if (!href || href == '#' || href == '' || href == '#' + id)
								return;

							// Cancel original event.
								event.preventDefault();
								event.stopPropagation();

							// Hide panel.
								$this._hide();

							// Redirect to href.
								window.setTimeout(function() {

									if (target == '_blank')
										window.open(href);
									else
										window.location.href = href;

								}, config.delay + 10);

						});

				}

			// Event: Touch stuff.
				$this.on('touchstart', function(event) {

					$this.touchPosX = event.originalEvent.touches[0].pageX;
					$this.touchPosY = event.originalEvent.touches[0].pageY;

				})

				$this.on('touchmove', function(event) {

					if ($this.touchPosX === null
					||	$this.touchPosY === null)
						return;

					var	diffX = $this.touchPosX - event.originalEvent.touches[0].pageX,
						diffY = $this.touchPosY - event.originalEvent.touches[0].pageY,
						th = $this.outerHeight(),
						ts = ($this.get(0).scrollHeight - $this.scrollTop());

					// Hide on swipe?
						if (config.hideOnSwipe) {

							var result = false,
								boundary = 20,
								delta = 50;

							switch (config.side) {

								case 'left':
									result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
									break;

								case 'right':
									result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
									break;

								case 'top':
									result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY > delta);
									break;

								case 'bottom':
									result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY < (-1 * delta));
									break;

								default:
									break;

							}

							if (result) {

								$this.touchPosX = null;
								$this.touchPosY = null;
								$this._hide();

								return false;

							}

						}

					// Prevent vertical scrolling past the top or bottom.
						if (($this.scrollTop() < 0 && diffY < 0)
						|| (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {

							event.preventDefault();
							event.stopPropagation();

						}

				});

			// Event: Prevent certain events inside the panel from bubbling.
				$this.on('click touchend touchstart touchmove', function(event) {
					event.stopPropagation();
				});

			// Event: Hide panel if a child anchor tag pointing to its ID is clicked.
				$this.on('click', 'a[href="#' + id + '"]', function(event) {

					event.preventDefault();
					event.stopPropagation();

					config.target.removeClass(config.visibleClass);

				});

		// Body.

			// Event: Hide panel on body click/tap.
				$body.on('click touchend', function(event) {
					$this._hide(event);
				});

			// Event: Toggle.
				$body.on('click', 'a[href="#' + id + '"]', function(event) {

					event.preventDefault();
					event.stopPropagation();

					config.target.toggleClass(config.visibleClass);

				});

		// Window.

			// Event: Hide on ESC.
				if (config.hideOnEscape)
					$window.on('keydown', function(event) {

						if (event.keyCode == 27)
							$this._hide(event);

					});

		return $this;

	};

	/**
	 * Apply "placeholder" attribute polyfill to one or more forms.
	 * @return {jQuery} jQuery object.
	 */
	$.fn.placeholder = function() {

		// Browser natively supports placeholders? Bail.
			if (typeof (document.createElement('input')).placeholder != 'undefined')
				return $(this);

		// No elements?
			if (this.length == 0)
				return $this;

		// Multiple elements?
			if (this.length > 1) {

				for (var i=0; i < this.length; i++)
					$(this[i]).placeholder();

				return $this;

			}

		// Vars.
			var $this = $(this);

		// Text, TextArea.
			$this.find('input[type=text],textarea')
				.each(function() {

					var i = $(this);

					if (i.val() == ''
					||  i.val() == i.attr('placeholder'))
						i
							.addClass('polyfill-placeholder')
							.val(i.attr('placeholder'));

				})
				.on('blur', function() {

					var i = $(this);

					if (i.attr('name').match(/-polyfill-field$/))
						return;

					if (i.val() == '')
						i
							.addClass('polyfill-placeholder')
							.val(i.attr('placeholder'));

				})
				.on('focus', function() {

					var i = $(this);

					if (i.attr('name').match(/-polyfill-field$/))
						return;

					if (i.val() == i.attr('placeholder'))
						i
							.removeClass('polyfill-placeholder')
							.val('');

				});

		// Password.
			$this.find('input[type=password]')
				.each(function() {

					var i = $(this);
					var x = $(
								$('<div>')
									.append(i.clone())
									.remove()
									.html()
									.replace(/type="password"/i, 'type="text"')
									.replace(/type=password/i, 'type=text')
					);

					if (i.attr('id') != '')
						x.attr('id', i.attr('id') + '-polyfill-field');

					if (i.attr('name') != '')
						x.attr('name', i.attr('name') + '-polyfill-field');

					x.addClass('polyfill-placeholder')
						.val(x.attr('placeholder')).insertAfter(i);

					if (i.val() == '')
						i.hide();
					else
						x.hide();

					i
						.on('blur', function(event) {

							event.preventDefault();

							var x = i.parent().find('input[name=' + i.attr('name') + '-polyfill-field]');

							if (i.val() == '') {

								i.hide();
								x.show();

							}

						});

					x
						.on('focus', function(event) {

							event.preventDefault();

							var i = x.parent().find('input[name=' + x.attr('name').replace('-polyfill-field', '') + ']');

							x.hide();

							i
								.show()
								.focus();

						})
						.on('keypress', function(event) {

							event.preventDefault();
							x.val('');

						});

				});

		// Events.
			$this
				.on('submit', function() {

					$this.find('input[type=text],input[type=password],textarea')
						.each(function(event) {

							var i = $(this);

							if (i.attr('name').match(/-polyfill-field$/))
								i.attr('name', '');

							if (i.val() == i.attr('placeholder')) {

								i.removeClass('polyfill-placeholder');
								i.val('');

							}

						});

				})
				.on('reset', function(event) {

					event.preventDefault();

					$this.find('select')
						.val($('option:first').val());

					$this.find('input,textarea')
						.each(function() {

							var i = $(this),
								x;

							i.removeClass('polyfill-placeholder');

							switch (this.type) {

								case 'submit':
								case 'reset':
									break;

								case 'password':
									i.val(i.attr('defaultValue'));

									x = i.parent().find('input[name=' + i.attr('name') + '-polyfill-field]');

									if (i.val() == '') {
										i.hide();
										x.show();
									}
									else {
										i.show();
										x.hide();
									}

									break;

								case 'checkbox':
								case 'radio':
									i.attr('checked', i.attr('defaultValue'));
									break;

								case 'text':
								case 'textarea':
									i.val(i.attr('defaultValue'));

									if (i.val() == '') {
										i.addClass('polyfill-placeholder');
										i.val(i.attr('placeholder'));
									}

									break;

								default:
									i.val(i.attr('defaultValue'));
									break;

							}
						});

				});

		return $this;

	};

	/**
	 * Moves elements to/from the first positions of their respective parents.
	 * @param {jQuery} $elements Elements (or selector) to move.
	 * @param {bool} condition If true, moves elements to the top. Otherwise, moves elements back to their original locations.
	 */
	$.prioritize = function($elements, condition) {

		var key = '__prioritize';

		// Expand $elements if it's not already a jQuery object.
			if (typeof $elements != 'jQuery')
				$elements = $($elements);

		// Step through elements.
			$elements.each(function() {

				var	$e = $(this), $p,
					$parent = $e.parent();

				// No parent? Bail.
					if ($parent.length == 0)
						return;

				// Not moved? Move it.
					if (!$e.data(key)) {

						// Condition is false? Bail.
							if (!condition)
								return;

						// Get placeholder (which will serve as our point of reference for when this element needs to move back).
							$p = $e.prev();

							// Couldn't find anything? Means this element's already at the top, so bail.
								if ($p.length == 0)
									return;

						// Move element to top of parent.
							$e.prependTo($parent);

						// Mark element as moved.
							$e.data(key, $p);

					}

				// Moved already?
					else {

						// Condition is true? Bail.
							if (condition)
								return;

						$p = $e.data(key);

						// Move element back to its original location (using our placeholder).
							$e.insertAfter($p);

						// Unmark element as moved.
							$e.removeData(key);

					}

			});

	};

})(jQuery);

document.getElementById("contact-form").addEventListener("submit", function (event) {
  const message = document.querySelector('textarea[name="message"]').value;

  if (!message.trim()) {
    event.preventDefault(); // Stop form submission
  }
});

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
  });
});

document.querySelectorAll('.flipquote').forEach(flipquote => {
  flipquote.addEventListener('click', () => {
    flipquote.classList.toggle('flipped');
  });
});

let startX = 0;
let currentX = 0;
let isDragging = false;
let currentIndex = 0;
const galleryImages = Array.from(document.querySelectorAll('.gallery img, .shelf-item img'));
const modal = document.getElementById('popup-modal');
const modalImg = document.getElementById('popup-image');
const imageWrapper = document.createElement('div'); // Wrapper for all images in the modal
imageWrapper.style.position = 'relative';
imageWrapper.style.width = '100%';
imageWrapper.style.height = '100%';

function openModal(imageSrc, index) {
  currentIndex = index; // Update index for current image

  // Populate image wrapper
  imageWrapper.innerHTML = '';
  galleryImages.forEach((image, i) => {
    const imgElement = document.createElement('img');
    imgElement.src = image.src.replace('-thumbnail', '');
    imgElement.style.flex = '0 0 100%';
    imgElement.style.maxHeight = '90vh';
    imgElement.style.objectFit = 'contain';
    imgElement.style.transition = 'transform 0.3s ease';
		imgElement.style.maxWidth = '100%'; // Scale within modal width
		imgElement.style.margin = 'auto'; // Center image

    if (i === currentIndex) imgElement.classList.add('current');
    imageWrapper.appendChild(imgElement);
  });

  imageWrapper.style.display = 'flex';
  imageWrapper.style.transition = 'transform 0.3s ease';
  imageWrapper.style.willChange = 'transform';

  const modalContent = modal.querySelector('.modal-content');
  modalContent.innerHTML = ''; // Clear existing content
  modalContent.appendChild(imageWrapper);

  updateModalPosition();

  modal.style.display = 'flex'; // Show modal
	modal.style.top = `${window.scrollY + 320}px`;
	modal.style.left = `50%`;
  modal.style.overflow = 'hidden'; // Prevent modal movement
  addSwipeListeners(); // Add swipe functionality
	modalContent.onclick = () => closeModal();
}

function closeModal() {
  modal.style.display = 'none'; // Hide modal
  modal.style.overflow = 'visible'; // Restore modal overflow
  removeSwipeListeners(); // Remove swipe functionality
  imageWrapper.innerHTML = ''; // Clear images
}

function navigateImage(direction) {
  currentIndex += direction;
  if (currentIndex < 0) {
    currentIndex = galleryImages.length - 1; // Wrap to last image
  } else if (currentIndex >= galleryImages.length) {
    currentIndex = 0; // Wrap to first image
  }

  updateModalPosition();
}

function updateModalPosition() {
  const translateX = -currentIndex * 100;
  imageWrapper.style.transform = `translateX(${translateX}%)`;
}

function addSwipeListeners() {
  imageWrapper.addEventListener('touchstart', handleTouchStart);
  imageWrapper.addEventListener('touchmove', handleTouchMove);
  imageWrapper.addEventListener('touchend', handleTouchEnd);
}

function removeSwipeListeners() {
  imageWrapper.removeEventListener('touchstart', handleTouchStart);
  imageWrapper.removeEventListener('touchmove', handleTouchMove);
  imageWrapper.removeEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(event) {
  startX = event.touches[0].clientX;
  isDragging = true;
  imageWrapper.style.transition = 'none'; // Disable transition during drag
}

function handleTouchMove(event) {
  if (!isDragging) return;

  currentX = event.touches[0].clientX;
  const diff = currentX - startX;

  const translateX = -currentIndex * 100 + (diff / modal.offsetWidth) * 100;
  imageWrapper.style.transform = `translateX(${translateX}%)`;
}

function handleTouchEnd() {
  if (!isDragging) return;

  isDragging = false;
  imageWrapper.style.transition = 'transform 0.3s ease'; // Smooth transition
  const diff = currentX - startX;

  if (diff < -50 && currentIndex < galleryImages.length - 1) {
    navigateImage(1); // Swipe left to next image
  } else if (diff > 50 && currentIndex > 0) {
    navigateImage(-1); // Swipe right to previous image
  } else {
    updateModalPosition(); // Snap back to current position
  }
}

// Attach click event to gallery images
galleryImages.forEach((image, index) => {
  image.addEventListener('click', () => {
    const fullImageSrc = image.getAttribute('src').replace('-thumbnail', '');
    openModal(fullImageSrc, index);
  });
});

// Attach keyboard navigation for modal
document.addEventListener('keydown', (event) => {
  if (modal.style.display === 'flex') {
    if (event.key === 'ArrowLeft') navigateImage(-1);
    if (event.key === 'ArrowRight') navigateImage(1);
    if (event.key === 'Escape') closeModal();
  }
});

// Auto-slide with infinite scrolling
let slideTimer = setInterval(() => slideShelves(), 2500); // Adjust interval as needed
let userInteracting = false;

function slideShelves() {
  if (!userInteracting) {
    const autoShelves = document.querySelectorAll('.shelf.auto-slide');
    autoShelves.forEach((shelf) => {
      const maxScrollLeft = shelf.scrollWidth - shelf.clientWidth; // // Total scrollable width. Wtf. I don't know why, but it works.
      shelf.scrollBy({ left: 200, behavior: 'smooth' }); // Scroll distance

      // Reset to start if reaching the end
      if (shelf.scrollLeft >= maxScrollLeft) {
        shelf.scrollLeft = 0; // Seamlessly reset to start
      }
    });
  }
}

function pauseAutoSlide() {
  userInteracting = true;
  clearInterval(slideTimer);
}

function resumeAutoSlide() {
  userInteracting = false;
  slideTimer = setInterval(() => slideShelves(), 2500);
}

document.querySelectorAll('.shelf').forEach((shelf) => {
  shelf.addEventListener('mousedown', pauseAutoSlide);
  shelf.addEventListener('mouseup', resumeAutoSlide);
  shelf.addEventListener('mouseenter', pauseAutoSlide);
  shelf.addEventListener('mouseleave', resumeAutoSlide);
  shelf.addEventListener('touchstart', pauseAutoSlide);
  shelf.addEventListener('touchend', resumeAutoSlide);
});

const phrases = ["code.", "sketch.", "write haiku.", "create."];
const animatedText = document.querySelector(".animated-text");
let phraseIndex = 0;
let charIndex = 0;

function typeEffect() {
  if (charIndex < phrases[phraseIndex].length) {
    animatedText.textContent += phrases[phraseIndex].charAt(charIndex);
    charIndex++;
    setTimeout(typeEffect, 150); // Typing speed
  } else {
    setTimeout(eraseEffect, 2000); // Pause before erasing
  }
}

function eraseEffect() {
  if (charIndex > 0) {
    animatedText.textContent = phrases[phraseIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(eraseEffect, 100); // Erase speed
  } else {
    phraseIndex = (phraseIndex + 1) % phrases.length;
    setTimeout(typeEffect, 500); // Pause before typing next phrase
  }
}

document.addEventListener("DOMContentLoaded", typeEffect);

const messages = [
  "Hi, Sonia!",
  "I've seen your works and...",
	"I have an idea..."
];

const input = document.getElementById("message");
let messageIndex = 0;
let charIndex2 = 0;

function typePlaceholder() {
  if (charIndex2 < messages[messageIndex].length) {
    input.placeholder += messages[messageIndex].charAt(charIndex2);
    charIndex2++;
    setTimeout(typePlaceholder, 150); // Typing speed
  } else {
    setTimeout(erasePlaceholder, 2000); // Pause before erasing
  }
}

function erasePlaceholder() {
  if (charIndex2 > 0) {
    input.placeholder = messages[messageIndex].substring(0, charIndex2 - 1);
    charIndex2--;
    setTimeout(erasePlaceholder, 100); // Erase speed
  } else {
    messageIndex = (messageIndex + 1) % messages.length;
    setTimeout(typePlaceholder, 500); // Pause before typing next message
  }
}

document.addEventListener("DOMContentLoaded", typePlaceholder);
