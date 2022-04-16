/**
 * @license
 * Copyright The Closure Library Authors.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Datastructure: Heap.
 *
 *
 * This file provides the implementation of a Heap datastructure. Smaller keys
 * rise to the top.
 *
 * The big-O notation for all operations are below:
 * <pre>
 *  Method          big-O
 * ----------------------------------------------------------------------------
 * - insert         O(logn)
 * - remove         O(logn)
 * - peek           O(1)
 * - contains       O(n)
 * </pre>
 */
// TODO(user): Should this rely on natural ordering via some Comparable
//     interface?


goog.provide('goog.structs.Heap');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.structs.Node');



/**
 * Class for a Heap datastructure.
 *
 * @param {goog.structs.Heap|Object=} opt_heap Optional goog.structs.Heap or
 *     Object to initialize heap with.
 * @constructor
 * @template K, V
 */
goog.structs.Heap = function(opt_heap) {
  'use strict';
  /**
   * The nodes of the heap.
   *
   * This is a densely packed array containing all nodes of the heap, using the
   * standard flat representation of a tree as an array (i.e. element [0] at the
   * top, with [1] and [2] as the second row, [3] through [6] as the third,
   * etc). Thus, the children of element `i` are `2i+1` and `2i+2`, and the
   * parent of element `i` is `⌊(i-1)/2⌋`.
   *
   * The only invariant is that children's keys must be greater than parents'.
   *
   * @private @const {!Array<!goog.structs.Node>}
   */
  this.nodes_ = [];

  if (opt_heap) {
    this.insertAll(opt_heap);
  }
};


/**
 * Insert the given value into the heap with the given key.
 * @param {K} key The key.
 * @param {V} value The value.
 */
goog.structs.Heap.prototype.insert = function(key, value) {
  'use strict';
  var node = new goog.structs.Node(key, value);
  var nodes = this.nodes_;
  nodes.push(node);
  this.moveUp_(nodes.length - 1);
};


/**
 * Adds multiple key-value pairs from another goog.structs.Heap or Object
 * @param {goog.structs.Heap|Object} heap Object containing the data to add.
 */
goog.structs.Heap.prototype.insertAll = function(heap) {
  'use strict';
  var keys, values;
  if (heap instanceof goog.structs.Heap) {
    keys = heap.getKeys();
    values = heap.getValues();

    // If it is a heap and the current heap is empty, I can rely on the fact
    // that the keys/values are in the correct order to put in the underlying
    // structure.
    if (this.getCount() <= 0) {
      var nodes = this.nodes_;
      for (var i = 0; i < keys.length; i++) {
        nodes.push(new goog.structs.Node(keys[i], values[i]));
      }
      return;
    }
  } else {
    keys = goog.object.getKeys(heap);
    values = goog.object.getValues(heap);
  }

  for (var i = 0; i < keys.length; i++) {
    this.insert(keys[i], values[i]);
  }
};


/**
 * Retrieves and removes the root value of this heap.
 * @return {V} The value removed from the root of the heap.  Returns
 *     undefined if the heap is empty.
 */
goog.structs.Heap.prototype.remove = function() {
  'use strict';
  var nodes = this.nodes_;
  var count = nodes.length;
  var rootNode = nodes[0];
  if (count <= 0) {
    return undefined;
  } else if (count == 1) {
    goog.array.clear(nodes);
  } else {
    nodes[0] = nodes.pop();
    this.moveDown_(0);
  }
  return rootNode.getValue();
};


/**
 * Retrieves but does not remove the root value of this heap.
 * @return {V} The value at the root of the heap. Returns
 *     undefined if the heap is empty.
 */
goog.structs.Heap.prototype.peek = function() {
  'use strict';
  var nodes = this.nodes_;
  if (nodes.length == 0) {
    return undefined;
  }
  return nodes[0].getValue();
};


/**
 * Retrieves but does not remove the key of the root node of this heap.
 * @return {K} The key at the root of the heap. Returns undefined if the
 *     heap is empty.
 */
goog.structs.Heap.prototype.peekKey = function() {
  'use strict';
  return this.nodes_[0] && this.nodes_[0].getKey();
};


/**
 * Moves the node at the given index down to its proper place in the heap.
 * @param {number} index The index of the node to move down.
 * @private
 */
goog.structs.Heap.prototype.moveDown_ = function(index) {
  'use strict';
  var nodes = this.nodes_;
  var count = nodes.length;

  // Save the node being moved down.
  var node = nodes[index];
  // While the current node has a child.
  while (index < (count >> 1)) {
    var leftChildIndex = this.getLeftChildIndex_(index);
    var rightChildIndex = this.getRightChildIndex_(index);

    // Determine the index of the smaller child.
    var smallerChildIndex = rightChildIndex < count &&
            nodes[rightChildIndex].getKey() < nodes[leftChildIndex].getKey() ?
        rightChildIndex :
        leftChildIndex;

    // If the node being moved down is smaller than its children, the node
    // has found the correct index it should be at.
    if (nodes[smallerChildIndex].getKey() > node.getKey()) {
      break;
    }

    // If not, then take the smaller child as the current node.
    nodes[index] = nodes[smallerChildIndex];
    index = smallerChildIndex;
  }
  nodes[index] = node;
};


/**
 * Moves the node at the given index up to its proper place in the heap.
 * @param {number} index The index of the node to move up.
 * @private
 */
goog.structs.Heap.prototype.moveUp_ = function(index) {
  'use strict';
  var nodes = this.nodes_;
  var node = nodes[index];

  // While the node being moved up is not at the root.
  while (index > 0) {
    // If the parent is greater than the node being moved up, move the parent
    // down.
    var parentIndex = this.getParentIndex_(index);
    if (nodes[parentIndex].getKey() > node.getKey()) {
      nodes[index] = nodes[parentIndex];
      index = parentIndex;
    } else {
      break;
    }
  }
  nodes[index] = node;
};


/**
 * Gets the index of the left child of the node at the given index.
 * @param {number} index The index of the node to get the left child for.
 * @return {number} The index of the left child.
 * @private
 */
goog.structs.Heap.prototype.getLeftChildIndex_ = function(index) {
  'use strict';
  return index * 2 + 1;
};


/**
 * Gets the index of the right child of the node at the given index.
 * @param {number} index The index of the node to get the right child for.
 * @return {number} The index of the right child.
 * @private
 */
goog.structs.Heap.prototype.getRightChildIndex_ = function(index) {
  'use strict';
  return index * 2 + 2;
};


/**
 * Gets the index of the parent of the node at the given index.
 * @param {number} index The index of the node to get the parent for.
 * @return {number} The index of the parent.
 * @private
 */
goog.structs.Heap.prototype.getParentIndex_ = function(index) {
  'use strict';
  return (index - 1) >> 1;
};


/**
 * Gets the values of the heap.
 * @return {!Array<V>} The values in the heap.
 */
goog.structs.Heap.prototype.getValues = function() {
  'use strict';
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for (var i = 0; i < l; i++) {
    rv.push(nodes[i].getValue());
  }
  return rv;
};


/**
 * Gets the keys of the heap.
 * @return {!Array<K>} The keys in the heap.
 */
goog.structs.Heap.prototype.getKeys = function() {
  'use strict';
  var nodes = this.nodes_;
  var rv = [];
  var l = nodes.length;
  for (var i = 0; i < l; i++) {
    rv.push(nodes[i].getKey());
  }
  return rv;
};


/**
 * Whether the heap contains the given value.
 * @param {V} val The value to check for.
 * @return {boolean} Whether the heap contains the value.
 */
goog.structs.Heap.prototype.containsValue = function(val) {
  'use strict';
  return goog.array.some(this.nodes_, function(node) {
    'use strict';
    return node.getValue() == val;
  });
};


/**
 * Whether the heap contains the given key.
 * @param {K} key The key to check for.
 * @return {boolean} Whether the heap contains the key.
 */
goog.structs.Heap.prototype.containsKey = function(key) {
  'use strict';
  return goog.array.some(this.nodes_, function(node) {
    'use strict';
    return node.getKey() == key;
  });
};


/**
 * Clones a heap and returns a new heap
 * @return {!goog.structs.Heap} A new goog.structs.Heap with the same key-value
 *     pairs.
 */
goog.structs.Heap.prototype.clone = function() {
  'use strict';
  return new goog.structs.Heap(this);
};


/**
 * The number of key-value pairs in the map
 * @return {number} The number of pairs.
 */
goog.structs.Heap.prototype.getCount = function() {
  'use strict';
  return this.nodes_.length;
};


/**
 * Returns true if this heap contains no elements.
 * @return {boolean} Whether this heap contains no elements.
 */
goog.structs.Heap.prototype.isEmpty = function() {
  'use strict';
  return this.nodes_.length === 0;
};


/**
 * Removes all elements from the heap.
 */
goog.structs.Heap.prototype.clear = function() {
  'use strict';
  goog.array.clear(this.nodes_);
};
